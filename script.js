// === STATE ===
let state = {
  teamA: { name: "India", runs: 0, wickets: 0, balls: 0, batsmen: [], bowlers: [] },
  teamB: { name: "Australia", runs: 0, wickets: 0, balls: 0, batsmen: [], bowlers: [] },
  currentTeam: "A",
  striker: null,
  nonStriker: null,
  currentBowler: null,
  currentOver: [],
  history: [],
  innings: 1
};

// Load from localStorage
if (localStorage.getItem("cricketState")) {
  state = JSON.parse(localStorage.getItem("cricketState"));
}

// === DOM ===
const els = {
  teamA: { name: document.getElementById("teamA-name"), runs: document.getElementById("runsA"), wickets: document.getElementById("wicketsA"), overs: document.getElementById("oversA"), bat: document.getElementById("batA") },
  teamB: { name: document.getElementById("teamB-name"), runs: document.getElementById("runsB"), wickets: document.getElementById("wicketsB"), overs: document.getElementById("oversB"), bat: document.getElementById("batB") },
  battingTeamName: document.getElementById("batting-team-name"),
  currentOver: document.getElementById("current-over-balls"),
  currentBowler: document.getElementById("current-bowler"),
  batsmenList: document.getElementById("batsmen-list"),
  bowlersList: document.getElementById("bowlers-list"),
  battingTable: document.querySelector("#batting-table tbody"),
  bowlingTable: document.querySelector("#bowling-table tbody"),
  teamAInput: document.getElementById("teamA"),
  teamBInput: document.getElementById("teamB")
};

// === HELPERS ===
function saveState() {
  localStorage.setItem("cricketState", JSON.stringify(state));
}

function toOvers(balls) {
  const o = Math.floor(balls / 6), b = balls % 6;
  return `${o}.${b}`;
}

function updateScoreboard() {
  const t = state[`team${state.currentTeam}`];
  const opp = state[`team${state.currentTeam === "A" ? "B" : "A"}`];
  els.teamA.runs.textContent = state.teamA.runs;
  els.teamA.wickets.textContent = state.teamA.wickets;
  els.teamA.overs.textContent = toOvers(state.teamA.balls);
  els.teamB.runs.textContent = state.teamB.runs;
  els.teamB.wickets.textContent = state.teamB.wickets;
  els.teamB.overs.textContent = toOvers(state.teamB.balls);

  els.teamA.bat.innerHTML = state.teamA.batsmen.filter(p => p.onStrike || p.onField).map(p => `${p.name}${p.onStrike ? "*" : ""}`).join(" & ") || "-";
  els.teamB.bat.innerHTML = state.teamB.batsmen.filter(p => p.onStrike || p.onField).map(p => `${p.name}${p.onStrike ? "*" : ""}`).join(" & ") || "-";

  els.battingTeamName.textContent = t.name;
  els.currentBowler.textContent = state.currentBowler ? ` | Bowler: ${state.currentBowler.name}` : "";
  els.currentOver.textContent = state.currentOver.join(" ");
  updateTables();
  saveState();
}

function updateTables() {
  const batting = state[`team${state.currentTeam}`].batsmen;
  const bowling = state[`team${state.currentTeam === "A" ? "B" : "A"}`].bowlers;

  els.battingTable.innerHTML = batting.map(p => `
    <tr style="background:${p.onStrike ? '#e3f2fd' : p.onField ? '#fff3e0' : ''}">
      <td>${p.name}${p.onStrike ? '*' : ''}</td>
      <td>${p.runs}</td>
      <td>${p.balls}</td>
      <td>${p.fours}</td>
      <td>${p.sixes}</td>
      <td>${p.balls ? (p.runs/p.balls*100).toFixed(1) : '0.0'}</td>
    </tr>`).join("");

  els.bowlingTable.innerHTML = bowling.map(p => {
    const overs = p.balls / 6;
    const econ = overs ? (p.runsConceded / overs).toFixed(2) : "0.00";
    return `<tr>
      <td>${p.name}${p === state.currentBowler ? '*' : ''}</td>
      <td>${Math.floor(overs)}.${p.balls%6}</td>
      <td>${p.maidens}</td>
      <td>${p.runsConceded}</td>
      <td>${p.wickets}</td>
      <td>${econ}</td>
    </tr>`;
  }).join("");
}

// === PLAYER MANAGEMENT ===
function createPlayer(name, team) {
  return {
    name,
    runs: 0, balls: 0, fours: 0, sixes: 0,
    onStrike: false, onField: false,
    // bowling
    ballsBowled: 0, runsConceded: 0, wickets: 0, maidens: 0
  };
}

document.getElementById("add-batsman").onclick = () => {
  const input = document.getElementById("new-batsman");
  const name = input.value.trim();
  if (!name) return;
  const team = state[`team${state.currentTeam}`];
  const player = createPlayer(name, state.currentTeam);
  team.batsmen.push(player);
  if (!state.striker) { player.onStrike = true; state.striker = player; }
  else if (!state.nonStriker) { player.onField = true; state.nonStriker = player; }
  input.value = "";
  renderPlayerLists();
  updateScoreboard();
};

document.getElementById("add-bowler").onclick = () => {
  const input = document.getElementById("new-bowler");
  const name = input.value.trim();
  if (!name) return;
  const team = state[`team${state.currentTeam === "A" ? "B" : "A"}`];
  const player = createPlayer(name, team);
  team.bowlers.push(player);
  if (!state.currentBowler) state.currentBowler = player;
  input.value = "";
  renderPlayerLists();
  updateScoreboard();
};

document.getElementById("change-bowler").onclick = () => {
  const team = state[`team${state.currentTeam === "A" ? "B" : "A"}`];
  const idx = prompt(`Choose bowler (0-${team.bowlers.length-1}):\n${team.bowlers.map((b,i)=>`${i}: ${b.name}`).join("\n")}`);
  if (idx !== null && team.bowlers[idx]) {
    endOver(); // finalize current
    state.currentBowler = team.bowlers[idx];
    state.currentOver = [];
    updateScoreboard();
  }
};

function renderPlayerLists() {
  const t = state[`team${state.currentTeam}`];
  els.batsmenList.innerHTML = t.batsmen.map((p, i) => `
    <li>
      <span>${p.name} (${p.runs} runs)</span>
      <button onclick="setStriker(${i})">Striker</button>
      <button onclick="dismissBatsman(${i})">Out</button>
    </li>`).join("");
  
  const opp = state[`team${state.currentTeam === "A" ? "B" : "A"}`];
  els.bowlersList.innerHTML = opp.bowlers.map((p, i) => `
    <li>
      <span>${p.name} (${p.wickets}/${p.runsConceded})</span>
      ${p === state.currentBowler ? "<strong>CURRENT</strong>" : `<button onclick="setBowler(${i})">Bowl</button>`}
    </li>`).join("");
}

window.setStriker = (idx) => {
  const t = state[`team${state.currentTeam}`];
  t.batsmen.forEach(p => p.onStrike = false);
  t.batsmen[idx].onStrike = true;
  state.striker = t.batsmen[idx];
  updateScoreboard();
};

window.setBowler = (idx) => {
  endOver();
  const team = state[`team${state.currentTeam === "A" ? "B" : "A"}`];
  state.currentBowler = team.bowlers[idx];
  state.currentOver = [];
  updateScoreboard();
};

window.dismissBatsman = (idx) => {
  const t = state[`team${state.currentTeam}`];
  const p = t.batsmen[idx];
  p.onStrike = false;
  p.onField = false;
  if (state.striker === p) state.striker = state.nonStriker;
  state.nonStriker = null;
  updateScoreboard();
};

// === BALL LOGIC ===
function addBall(runs, isExtra = false, type = "") {
  if (!state.striker || !state.currentBowler) return alert("Set striker & bowler first!");

  const team = state[`team${state.currentTeam}`];
  team.runs += runs;
  if (!isExtra) team.balls += 1;
  state.striker.balls += 1;
  state.striker.runs += runs;
  if (runs === 4) state.striker.fours++;
  if (runs === 6) state.striker.sixes++;

  state.currentBowler.ballsBowled += 1;
  state.currentBowler.runsConceded += runs;

  const ballText = runs + (type ? ` ${type}` : "");
  state.currentOver.push(ballText);
  state.history.push({ runs, isExtra, type, striker: state.striker.name, bowler: state.currentBowler.name });

  // Rotate strike on odd runs
  if (!isExtra && runs % 2 === 1) [state.striker, state.nonStriker] = [state.nonStriker, state.striker];

  // End of over?
  if (state.currentOver.length === 6) endOver();

  updateScoreboard();
}

function addWicket() {
  if (!state.striker) return;
  const team = state[`team${state.currentTeam}`];
  team.wickets += 1;
  team.balls += 1;
  state.currentBowler.wickets += 1;
  state.currentOver.push("W");
  state.history.push({ wicket: true, striker: state.striker.name, bowler: state.currentBowler.name });
  dismissBatsman(state[`team${state.currentTeam}`].batsmen.indexOf(state.striker));
  if (team.wickets === 10) setTimeout(() => alert("All out!"), 300);
  if (state.currentOver.length === 6) endOver();
  updateScoreboard();
}

function endOver() {
  if (state.currentOver.length === 0) return;
  const runsThisOver = state.currentOver.filter(b => !isNaN(b)).reduce((a,b)=>a+ +b, 0);
  if (runsThisOver === 0) state.currentBowler.maidens++;
  // Rotate strike at end of over
  [state.striker, state.nonStriker] = [state.nonStriker, state.striker];
  state.currentOver = [];
}

function undo() {
  const last = state.history.pop();
  if (!last) return;
  // Simplified undo – remove last ball
  const team = state[`team${state.currentTeam}`];
  if (last.wicket) {
    team.wickets = Math.max(0, team.wickets - 1);
    state.currentBowler.wickets = Math.max(0, state.currentBowler.wickets - 1);
  } else {
    team.runs = Math.max(0, team.runs - last.runs);
    if (!last.isExtra) team.balls = Math.max(0, team.balls - 1);
    const striker = team.batsmen.find(p => p.name === last.striker);
    if (striker) {
      striker.runs -= last.runs;
      if (!last.isExtra) striker.balls = Math.max(0, striker.balls - 1);
      if (last.runs === 4) striker.fours--;
      if (last.runs === 6) striker.sixes--;
    }
    state.currentBowler.runsConceded -= last.runs;
    if (!last.isExtra) state.currentBowler.ballsBowled--;
  }
  state.currentOver.pop();
  updateScoreboard();
}

// === EVENT LISTENERS ===
document.querySelectorAll("button[data-runs]").forEach(btn => {
  btn.addEventListener("click", () => addBall(+btn.dataset.runs));
});
document.getElementById("wicket").addEventListener("click", addWicket);
document.getElementById("wide").addEventListener("click", () => addBall(1, true, "wd"));
document.getElementById("noball").addEventListener("click", () => addBall(1, true, "nb"));
document.getElementById("bye").addEventListener("click", () => addBall(prompt("Bye runs?", 1)|0, true, "b"));
document.getElementById("legbye").addEventListener("click", () => addBall(prompt("Leg bye runs?", 1)|0, true, "lb"));
document.getElementById("undo").addEventListener("click", undo);
document.getElementById("reset").addEventListener("click", () => confirm("Reset all?") && (localStorage.clear(), location.reload()));
document.getElementById("export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `cricket-match-${Date.now()}.json`;
  a.click();
});

// Team name sync
els.teamAInput.addEventListener("change", e => { state.teamA.name = e.target.value; updateScoreboard(); });
els.teamBInput.addEventListener("change", e => { state.teamB.name = e.target.value; updateScoreboard(); });

// Init
renderPlayerLists();
updateScoreboard();
