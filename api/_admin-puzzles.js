/**
 * api/admin-puzzles.js
 * GET /api/admin-puzzles
 * 
 * Returns all puzzles loaded from local JSON data files.
 */
const fs = require('fs');
const path = require('path');
const { logRequest, logError } = require('./_logger');

module.exports = async function handler(req, res) {
  const t0 = Date.now();
  try {
    if (req.method !== 'GET') {
      logRequest(req, { status: 405, ms: Date.now() - t0 });
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const dataDir = path.join(process.cwd(), 'data');
    const puzzleFiles = ['puzzles_4-5.json', 'puzzles_6-7.json', 'puzzles_8-9.json'];
    
    let allPuzzles = [];

    for (const file of puzzleFiles) {
      try {
        const filePath = path.join(dataDir, file);
        if (fs.existsSync(filePath)) {
          const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          // Flatten puzzle data (it's array of days or array of objects)
          fileData.forEach(dayOrPuzzle => {
            if (dayOrPuzzle.puzzles) {
              dayOrPuzzle.puzzles.forEach(p => {
                allPuzzles.push({ ...p, sourceBand: file.replace('puzzles_', '').replace('.json', '') });
              });
            } else {
              allPuzzles.push({ ...dayOrPuzzle, sourceBand: file.replace('puzzles_', '').replace('.json', '') });
            }
          });
        }
      } catch (err) {
        logError(req, new Error(`Failed to parse ${file}: ${err.message}`));
      }
    }

    logRequest(req, { status: 200, ms: Date.now() - t0, count: allPuzzles.length });
    return res.status(200).json(allPuzzles);

  } catch (err) {
    logError(req, err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};
