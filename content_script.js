//WHEN REPLAY IS PRESSED
function handleAriaPressedChange(mutationsList) {
  for (const mutation of mutationsList) {
    if (mutation.type === 'attributes' && mutation.attributeName === 'aria-pressed') {
      if (mutation.target.getAttribute('aria-pressed') === 'true') {
        console.log("*********replay is true!*********");
        chrome.runtime.sendMessage({action : "replayOn"});

      } else if (mutation.target.getAttribute('aria-pressed') === 'false'){
          console.log("*****replay is false*****");
          chrome.runtime.sendMessage({action : "replayOff"});
      }
    }
  }
}

function waitForElement() {
  const targetElement = document.querySelector('#header-toolbar-replay');
  if (targetElement) {
    console.log("page loaded");
    observeElement('header-toolbar-replay', 'aria-pressed');

  } else {
    setTimeout(waitForElement, 1000);
  }
}

function observeElement(elementToObserve, pressedAttribute){

  const buttonElement = document.getElementById(elementToObserve);
  const observer = new MutationObserver(handleAriaPressedChange);
  const observerConfig = { attributes: true, attributeFilter: [pressedAttribute] };
  observer.observe(buttonElement, observerConfig);
}


console.log("page starrted");
waitForElement();