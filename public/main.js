const form = document.getElementById("vote-form");
var event;
const email = sessionStorage.getItem("key");
let count = localStorage.getItem(email) ?? "error";
console.log(count);
console.log(email);
form.addEventListener("submit", (e) => {
  if (isNaN(count) || email === null) return;
  count++;
  if (count > 1) {
    const hidden = document.querySelector("#hasVotedAlreadyErrorMsg");
    hidden.style.display = "block";
  } else {
    const choice = document.querySelector("input[name=os]:checked").value;
    const data = { os: choice };
    console.log(count);

    fetch("https://online-voting-app.arunsingh01.repl.co/poll", {
      method: "post",
      body: JSON.stringify(data),
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    })
      .then((res) => res.json())
      .catch((err) => console.log(err));

    const voted = document.querySelector("#voted");
    voted.style.display = "block";
  }
  localStorage.setItem(email, count);
  e.preventDefault();
});

fetch("http://localhost:3000/poll")
  .then((res) => res.json())
  .then((data) => {
    let votes = data.votes;
    let totalVotes = votes.length;
    document.querySelector(
      "#chartTitle"
    ).textContent = `Total Votes: ${totalVotes}`;

    let voteCounts = {
      Windows: 0,
      MacOS: 0,
      Linux: 0,
      Other: 0,
    };

    voteCounts = votes.reduce(
      (acc, vote) => (
        (acc[vote.os] = (acc[vote.os] || 0) + parseInt(vote.points)), acc
      ),
      {}
    );

    let dataPoints = [
      { label: "Windows", y: voteCounts.Windows },
      { label: "MacOS", y: voteCounts.MacOS },
      { label: "Linux", y: voteCounts.Linux },
      { label: "Other", y: voteCounts.Other },
    ];

    const chartContainer = document.querySelector("#chartContainer");

    if (chartContainer) {
      // Listen for the event.
      document.addEventListener("votesAdded", function(e) {
        document.querySelector(
          "#chartTitle"
        ).textContent = `Total Votes: ${e.detail.totalVotes}`;
      });

      const chart = new CanvasJS.Chart("chartContainer", {
        animationEnabled: true,
        theme: "theme1",
        data: [
          {
            type: "column",
            dataPoints: dataPoints,
          },
        ],
      });
      chart.render();

      Pusher.logToConsole = true; //Pusher console.log()

      var pusher = new Pusher("03fa0ff57d4c80fce445", {
        cluster: "ap2",
      });

      var channel = pusher.subscribe("os-poll");

      channel.bind("os-vote", function(data) {
        dataPoints.forEach((point) => {
          if (point.label == data.os) {
            point.y += data.points;
            totalVotes += data.points;
            event = new CustomEvent("votesAdded", {
              detail: { totalVotes: totalVotes },
            });
            // Dispatch the event.
            document.dispatchEvent(event);
          }
        });
        chart.render();
      });
    }
  });
