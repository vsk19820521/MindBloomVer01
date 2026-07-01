const { supabase } = require('./api/_supabase');

async function testFailures() {
  console.log("Fetching puzzle_failures...");
  const { data, error } = await supabase.from('puzzle_failures').select('*');
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Failures in DB:", data);
  }
}
testFailures();
