// client-side js, loaded by index.html

async function GetEntries() {
  const json = await fetch("/getEntries?" + Math.round(Math.random() * 10000));
  const entries = await json.json(); // parse the JSON from the server
  return entries;
}

async function GetIP() {
  const json = await fetch("/getIP");
  const IP = await json.json(); // parse the JSON from the server
  return IP;
}

function EnterScore(name, score) {
  GetIP().then((IP) => {
    const data = { username: name, score: score, ip: IP.ip };
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
    fetch("/postEntry", options);
  });
}

function offset(el) {
  const rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
}

function createCheckable(
  startState,
  message,
  x,
  y,
  checkX,
  callback,
  fontsize,
  style
) {
  const element = document.createElement("p");
  element.innerHTML = message;
  element.style =
    "position: absolute; top: " +
    y +
    "px; left: " +
    x +
    "px; color: white; font: " +
    fontsize +
    "px sans-serif;" +
    style;
  const check = document.createElement("p");
  check.style =
    "position: absolute; top: 0px; left: " +
    checkX +
    "px; color: white; font: " +
    fontsize +
    "px sans-serif;" +
    style;
  check.innerHTML = startState ? "&#10003;" : "X";
  function toggle(event) {
    let isChecked = event.target.innerHTML === "X";
    event.target.innerHTML = isChecked ? "&#10003;" : "X";
    callback(isChecked);
  }
  check.addEventListener("click", toggle);
  check.addEventListener("touchstart", toggle);
  element.appendChild(check);
  return element;
}

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

function createSlider(
  startValue,
  message,
  x,
  y,
  min,
  max,
  fontsize,
  callback,
  style
) {
  const element = document.createElement("div");
  element.style =
    "position: absolute; top: " + y + "px; left: " + x + "px; width: 100%";
  const label = document.createElement("p");
  label.innerHTML = message + startValue;
  label.style =
    "position: absolute; top: 0px; left: 0px; color: white; font: " +
    fontsize +
    "px sans-serif;" +
    style;
  element.appendChild(label);
  // <input type="range" min="1" max="100" value="50">
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = min;
  slider.max = max;
  slider.value = startValue;
  slider.style =
    "position: absolute; width: " +
    9.9 * fontsize +
    "px; top: " +
    1.5 * fontsize +
    "px; left: 0px;" +
    style;
  slider.oninput = function (e) {
    label.textContent = message + this.value;
    callback(this.value);
    e.target.setAttribute("data-changing", "true");
  };
  element.appendChild(slider);
  return element;
}

function createButton(message, x, y, color, callback) {
  const button = document.createElement("button");
  button.textContent = message;
  button.style =
    "position: absolute; top: " +
    y +
    "px; left: " +
    x +
    "px; background-color: " +
    color;
  button.addEventListener("click", callback);
  button.addEventListener("touchstart", callback);
  return button;
}

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  const expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  const name = cname + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    const c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function ontouch(el, callback) {
  let touchsurface = el,
    dir,
    swipeType,
    startX,
    startY,
    distX,
    distY,
    threshold = 150, // required min distance traveled to be considered swipe
    restraint = 100, // maximum distance allowed at the same time in perpendicular direction
    allowedTime = 500, // maximum time allowed to travel that distance
    elapsedTime,
    startTime,
    handletouch =
      callback ||
      function (evt, dir, phase, swipetype, distance, elapsedtime) {};

  touchsurface.addEventListener(
    "touchstart",
    function (e) {
      const touchobj = e.changedTouches[0];
      dir = "none";
      swipeType = "none";
      distX = 0;
      distY = 0;
      startX = touchobj.pageX;
      startY = touchobj.pageY;
      startTime = new Date().getTime(); // record time when finger first makes contact with surface
      handletouch(e, "none", "start", swipeType, 0, 0); // fire callback function with params dir="none", phase="start", swipetype="none" etc
      if (e.target.type != "range") e.preventDefault();
    },
    false
  );

  touchsurface.addEventListener(
    "touchmove",
    function (e) {
      const touchobj = e.changedTouches[0];
      distX = touchobj.pageX - startX; // get horizontal dist traveled by finger while in contact with surface
      distY = touchobj.pageY - startY; // get vertical dist traveled by finger while in contact with surface
      if (Math.abs(distX) > Math.abs(distY)) {
        // if distance traveled horizontally is greater than vertically, consider this a horizontal movement
        dir = distX < 0 ? "left" : "right";
        handletouch(
          e,
          dir,
          "move",
          swipeType,
          distX,
          new Date().getTime() - startTime
        ); // fire callback function with params dir="left|right", phase="move", swipetype="none" etc
      } else {
        // else consider this a vertical movement
        dir = distY < 0 ? "up" : "down";
        handletouch(
          e,
          dir,
          "move",
          swipeType,
          distY,
          new Date().getTime() - startTime
        ); // fire callback function with params dir="up|down", phase="move", swipetype="none" etc
      }
      if (e.target.type != "range") e.preventDefault(); // prevent scrolling when inside DIV
    },
    false
  );

  touchsurface.addEventListener(
    "touchend",
    function (e) {
      const touchobj = e.changedTouches[0];
      elapsedTime = new Date().getTime() - startTime; // get time elapsed
      if (elapsedTime <= allowedTime) {
        // first condition for awipe met
        if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
          // 2nd condition for horizontal swipe met
          swipeType = dir; // set swipeType to either "left" or "right"
        } else if (
          Math.abs(distY) >= threshold &&
          Math.abs(distX) <= restraint
        ) {
          // 2nd condition for vertical swipe met
          swipeType = dir; // set swipeType to either "top" or "down"
        }
      }
      // Fire callback function with params dir="left|right|up|down", phase="end", swipetype=dir etc:
      handletouch(
        e,
        dir,
        "end",
        swipeType,
        dir == "left" || dir == "right" ? distX : distY,
        elapsedTime
      );
      if (e.target.type != "range" || e.target.dataset.changing != "true")
        e.preventDefault();
    },
    false
  );
}
