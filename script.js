// State
let state = {
  teamA: { name: "India", runs: 0, wickets: 0, balls: 0 },
  teamB: { name: "Australia", runs: 0, wickets: 0, balls: 0 },
  currentTeam: "A",
  history: []   // for undo
};

// DOM cache
const els = {
  teamA: { name: document.getElementById("teamA-name"), runs: document.getElementById("runsA"), wickets: document.getElementById("wicketsA"), overs: document.getElementById("oversA") },
  teamB: { name: document.getElementById("teamB-name"), runs: document.getElementById("runsB"), wickets: document.getElementById("wicketsB"), overs: document.getElementById("oversB") },
  log: document.getElementById("ball-log"),
  teamAInput: document.getElementById("teamA"),
  teamBInput: document.getElementById("teamB")
};

// Helper: update UI
function updateUI() {
  const tA = state.teamA, tB = state.teamB;
  els.teamA.name.textContent = tA.name;
  els.teamB.name.textContent = tB.name;
  els.teamA.runs.textContent = tA.runs;
  els.teamA.wickets.textContent = tA.wickets;
  els.teamA.overs.textContent = toOvers(tA.balls);
  els.teamB.runs.textContent = tB.runs;
  els.teamB.wickets.textContent = tB.wickets;
  els.teamB.overs.textContent = toOvers(tB.balls);
}

// Convert balls → overs string
function toOvers(balls) {
  const overs = Math.floor(balls / 6);
  const ball = balls % 6;
  return `${overs}.${ball}`;
}

// Add ball to log
function logBall(text) {
  const li = document.createElement("li");
  li.textContent = text;
  els.log.prepend(li);
  state.history.push({ text, team: state.currentTeam });
}

// Switch team (you can call this manually or auto after 10 wickets)
function switchTeam() {
  state.currentTeam = state.currentTeam === "A" ? "B" : "A";
  alert(`Innings over! Now batting: ${state[`team${state.currentTeam}`].name}`);
}

// Core: add runs
function addRuns(runs, extra = "") {
  const team = state[`team${state.currentTeam}`];
  team.runs += runs;
  team.balls += 1;
  const overStr = toOvers(team.balls);
  logBall(`${overStr}: ${runs}${extra}`);
  updateUI();
}

// Wicket
function addWicket() {
  const team = state[`team${state.currentTeam}`];
  if (team.wickets >= 10) return alert("All out!");
  team.wickets += 1;
  team.balls += 1;
  logBall(`${toOvers(team.balls)}: WICKET! (${team.wickets}/10)`);
  updateUI();
  if (team.wickets === 10) setTimeout(switchTeam, 800);
}

// Undo last ball
function undo() {
  const last = state.history.pop();
  if (!last) return;
  const team = state[`team${last.team}`];
  // Very simple undo – just subtract last run or wicket
  if (last.text.includes("WICKET")) {
    team.wickets = Math.max(0, team.wickets - 1);
  } else {
    const runs = parseInt(last.text.split(":")[1].trim().match(/\d+/)?.[0] || 0);
    team.runs = Math.max(0, team.runs - runs);
  }
  team.balls = Math.max(0, team.balls - 1);
  els.log.removeChild(els.log.firstChild);
  updateUI();
}

// Reset everything
function reset() {
  if (!confirm("Reset entire match?")) return;
  state.teamA = { name: els.teamAInput.value || "Team A", runs:0, wickets:0, balls:0 };
  state.teamB = { name: els.teamBInput.value || "Team B", runs:0, wickets:0, balls:0 };
  state.currentTeam = "A";
  state.history = [];
  els.log.innerHTML = "";
  updateUI();
}

// ---- Event Listeners ----
document.querySelectorAll("button[data-runs]").forEach(btn => {
  btn.addEventListener("click", () => addRuns(+btn.dataset.runs));
});
document.getElementById("wicket").addEventListener("click", addWicket);
document.getElementById("wide").addEventListener("click", () => addRuns(1, " (wd)"));
document.getElementById("noball").addEventListener("click", () => addRuns(1, " (nb)"));
document.getElementById("undo").addEventListener("click", undo);
document.getElementById("reset").addEventListener("click", reset);

// Sync team names
els.teamAInput.addEventListener("change", e => { state.teamA.name = e.target.value; updateUI(); });
els.teamBInput.addEventListener("change", e => { state.teamB.name = e.target.value; updateUI(); });

// Init
updateUI();
