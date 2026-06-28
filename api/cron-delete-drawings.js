/**
 * api/cron-delete-drawings.js
 * GET /api/cron-delete-drawings
 * 
 * Vercel Cron endpoint.
 * Purges drawings that have expired or are already approved.
 */

const { supabase } = require('./_supabase');
const { logRequest, logError } = require('./_logger');

module.exports = async function handler(req, res) {
  const t0 = Date.now();

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      logRequest(req, { status: 405, ms: Date.now() - t0 });
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Verify Vercel Cron Header if needed (optional but good practice)
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logRequest(req, { status: 401, ms: Date.now() - t0 });
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // 1. Fetch all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username, game_state');

    if (usersError) throw usersError;

    let filesToDelete = [];
    let usersToUpdate = [];

    const now = new Date();

    users.forEach(user => {
      let needsUpdate = false;
      const gameState = user.game_state;
      if (!gameState || !gameState.completedPuzzles) return;

      const completedPuzzles = gameState.completedPuzzles;
      
      Object.keys(completedPuzzles).forEach(puzzleId => {
        const record = completedPuzzles[puzzleId];
        
        // Check if there's a drawing stored
        if (record.userAnswer && typeof record.userAnswer === 'string' && record.userAnswer.startsWith('drawings/')) {
          
          let shouldDelete = false;

          // 1. Approved drawings (pendingApproval === false)
          if (record.pendingApproval === false) {
            shouldDelete = true;
          } 
          // 2. Expired drawings
          else if (record.drawingExpiresAt && new Date(record.drawingExpiresAt) < now) {
            shouldDelete = true;
          }

          if (shouldDelete) {
            // Strip the 'drawings/' prefix for the storage API
            filesToDelete.push(record.userAnswer.substring('drawings/'.length));
            
            // Clean up JSONB
            delete record.userAnswer;
            delete record.drawingExpiresAt;
            // Ensure pendingApproval is cleared if it was expired without approval
            if (record.pendingApproval !== undefined) {
                delete record.pendingApproval;
            }
            needsUpdate = true;
          }
        }
      });

      if (needsUpdate) {
        usersToUpdate.push({
          username: user.username,
          game_state: gameState
        });
      }
    });

    // 2. Delete files from Storage
    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('drawings')
        .remove(filesToDelete);
        
      if (storageError) throw storageError;
    }

    // 3. Update Users in DB
    for (const update of usersToUpdate) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ game_state: update.game_state, updated_at: new Date().toISOString() })
        .eq('username', update.username);
        
      if (updateError) throw updateError;
    }

    logRequest(req, { status: 200, ms: Date.now() - t0 });
    return res.status(200).json({ 
      success: true, 
      deletedCount: filesToDelete.length,
      updatedUsersCount: usersToUpdate.length 
    });

  } catch (err) {
    logError({ endpoint: '/api/cron-delete-drawings' }, err);
    logRequest(req, { status: 500, ms: Date.now() - t0 });
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
