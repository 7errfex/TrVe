extractedObjects = []
replay = false
const webAppUrl = "https://script.google.com/macros/s/"
candles = []

function getCandles(symbol, startTime, endTime, interval){
  var amount = ((endTime - startTime)/60).toFixed(0)
  fetch(`https://api.polygon.io/v2/aggs/ticker/C:${symbol}/range/${interval}/minute/${startTime * 1000}/${endTime * 1000}?adjusted=true&sort=asc&limit=${amount}&apiKey=y5ym_Wm2JPeHAE2eu9ZFm7EV2aDohHY8`).then(function(response) { return response.json()}).then(function (data) {
    console.log(data)
    candles = data.results
  })
}

function getProfit(symbol, interval, startTime, endTime, entryPrice, stopLoss, target) {
  let index = 0;
  getCandles(symbol, startTime, endTime, interval)
  for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      index++;

      if (entryPrice >= candle.l && entryPrice <= candle.h) {
          const position = candles.slice(index);

          for (let j = 0; j < position.length; j++) {
              const posCandle = position[j];

              if (stopLoss >= posCandle.l && stopLoss <= posCandle.h) {
                  const profit = stopLoss - entryPrice;
                  return profit;
              } else if (target >= posCandle.l && target <= posCandle.h) {
                  const profit = target - entryPrice;
                  return profit;
              } else if (j === position.length - 1) {
                  const profit = posCandle.c - entryPrice;
                  return profit;
              }
          }
      }
  }

  return 0; // Default value if no profit condition is met
}

// Function to send the POST request
function sendPostRequest(data) {
  fetch(webAppUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    mode: 'no-cors',
  })
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "replayOn") {
    console.log("Repaly on")
    replay = true;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "replayOff") {
    console.log("replay off")
    replay = false;
  }
});

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    const requestBody = details.requestBody;
    console.log("Hed: ", details.url)
    console.log("requestBody: ", requestBody)
    const arrayBuffer = details.requestBody.raw[0].bytes;
    const textData = new TextDecoder().decode(arrayBuffer);
    console.log("text body: ", JSON.parse(textData));

    const inputJson = JSON.parse(textData);

    const sourceId = Object.keys(inputJson.sources)[0];
    const data = inputJson["sources"];
    if(data[sourceId] === null){
      console.log("detected deletion of ", sourceId)
      return {}
    }
    const sourceData = inputJson.sources[sourceId].state;

    const extractedData = {
        id: sourceData.id,
        riskDisplayMode: sourceData.state.riskDisplayMode,
        symbol: sourceData.state.symbol,
        interval: sourceData.state.interval,
        stopLevel: sourceData.state.stopLevel,
        profitLevel: sourceData.state.profitLevel,
        qty: sourceData.state.qty,
        amountTarget: sourceData.state.amountTarget,
        amountStop: sourceData.state.amountStop
    };

    // Extract points and convert time to GMT
    extractedData.pointA = {
        price: sourceData.points[0].price,
        time: new Date(sourceData.points[0].time_t * 1000).toUTCString(),
        epochTime: sourceData.points[0].time_t
    };
    extractedData.pointB = {
        price: sourceData.points[1].price,
        time: new Date(sourceData.points[1].time_t * 1000).toUTCString(),
        epochTime: sourceData.points[1].time_t
    };

    console.log(extractedData);

    const parsedData = {
        id: extractedData.id,
        currency: extractedData.symbol,
        RRR: (extractedData.profitLevel / extractedData.stopLevel).toFixed(3),
        entryPrice: extractedData.pointA.price.toFixed(4),
        stopLoss: (extractedData.pointA.price - (extractedData.stopLevel * 0.00001)).toFixed(4),
        targetPrice: (extractedData.pointA.price + (extractedData.profitLevel * 0.00001)).toFixed(4),
        startTime: extractedData.pointA.time,
        endTime: extractedData.pointB.time,
        startEpochTime: extractedData.pointA.epochTime,
        endEpochTime: extractedData.pointB.epochTime,
        interval: extractedData.interval
    }
    console.log(parsedData)
    const index = extractedObjects.findIndex(obj => obj.id === parsedData.id);
    if (index !== -1) {
      extractedObjects[index] = parsedData;
      extractedObjects.splice(index, 1);
    }
    extractedObjects.push(parsedData)

    return {};
  },
  {
    urls: ["https://charts-storage.tradingview.com/charts-storage/layout/*"],
    types: ["xmlhttprequest"],
  },
  ["requestBody"]
);
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "syncTransactions") {
    
    const readydata = {name: message.username,accsize: message.accsize, risk: message.risk, reason: message.reason, data: extractedObjects}
    console.log("user sent sync, ", readydata)
    sendPostRequest(readydata)
    }
});
