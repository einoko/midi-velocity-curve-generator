const cs = new CanvasSpliner.CanvasSpliner("curve", 480, 480);

// CanvasSpliner settings
cs.setSplineType("smooth");
cs.setCurveThickness(3);
cs.setGridStep(1 / 8);
cs.setControlPointRadius(8);

// Add default points
cs.add({ x: 0.0025, y: 0.0025, safe: true });
cs.add({ x: 0.5, y: 0.5 });
cs.add({ x: 0.9975, y: 0.9975, safe: true });

const generateVelocityArray = () => {
  const velocityArray = [];
  // interpolate values from 1 to 128
  for (let i = 1; i <= 128; i++) {
    let velocity = cs.getValue(i / 128);

    // Normalize unwanted values
    velocity = velocity < 0 ? 0 : velocity;
    velocity = velocity > 1.0 ? 1.0 : velocity;

    // Subtract 1 from velocity value (MIDI is 0-127)
    velocity = Math.round(128 * velocity) - 1;

    // Normalize unwanted values again
    velocity = velocity < 0 ? 0 : velocity;
    velocity = isNaN(velocity) ? 127 : velocity;

    velocityArray.push(velocity);
  }
  return velocityArray;
};

const generateJSCode = velocityArray => {
  return `// ${JSON.stringify(cs._pointCollection._points)}

var velocities = [${velocityArray.join(", ")}];

function HandleMIDI(event) {
  event.velocity = velocities[event.velocity];
  event.send();
}`;
};

const triggerGenerate = () => {
  myCodeMirror.getDoc().setValue(generateJSCode(generateVelocityArray()));
};

cs.on("movePoint", () => {
  triggerGenerate();
});

cs.on("releasePoint", () => {
  triggerGenerate();
});

cs.on("pointAdded", () => {
  triggerGenerate();
});

cs.on("pointRemoved", () => {
  triggerGenerate();
});

Array.from(document.getElementsByClassName("radio-inline__input")).map(
  element => {
    element.onclick = () => {
      cs.setSplineType(element.value);
      cs.draw();
      triggerGenerate();
    };
  }
);

const changeInputText = text => {
  document.getElementById("loadCurveInput").value = text;
};

const loadCurve = () => {
  try {
    let textValue = document.getElementById("loadCurveInput").value;
    // In case user forgets to remove comments
    textValue =
      textValue.substring(0, 2) === "//" ? textValue.substring(3) : textValue;
    cs._pointCollection._points = JSON.parse(textValue);
    cs.draw();
    triggerGenerate();
  } catch (e) {
    changeInputText("Error in parsing JSON data.");
  }
};

const copyCode = () => {
  const el = document.createElement("textarea");
  el.value = myCodeMirror.getValue();
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
};

const myCodeMirror = CodeMirror(document.getElementById("editor"), {
  value: generateJSCode(generateVelocityArray()),
  lineWrapping: true,
  readOnly: true,
  mode: "javascript"
});

triggerGenerate();
