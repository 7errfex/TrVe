document.addEventListener("DOMContentLoaded", function () {
  document.getElementById('syncButton').addEventListener('click', function (event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const accsize = document.getElementById('accsize').value;
    const risk = document.getElementById('risk').value;
    const reason = document.getElementById('reason').value;
    if (username && accsize && risk) {
        chrome.runtime.sendMessage({action : "syncTransactions", username: username , accsize: accsize, risk: risk, reason: reason});
    }
  });
});