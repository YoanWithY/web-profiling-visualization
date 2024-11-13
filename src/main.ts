const ySize = 30;

function updateDivs(obj: any, xScale: number) {
  const div = obj.div;
  if (!div)
    return;
  const start = obj.start;
  const end = obj.end;

  div.style.height = `${ySize}px`;
  div.style.width = `${xScale * (end - start)}px`;
  div.style.left = `${xScale * start}px`;
  div.style.top = `${ySize * obj.yOffset}px`;

  for (const o of obj.innerCalls)
    updateDivs(o, xScale);
}

function scrollToFraction(element: HTMLElement, event: MouseEvent, lastScale: number, newScale: number) {
  const rect = element.getBoundingClientRect(); // Get the visible area of the div
  const mouseXInView = event.clientX - rect.left; // Mouse x within the visible area
  const mouseXInContent = element.scrollLeft + mouseXInView; // Mouse x within the entire content
  const newMouseXInContent = mouseXInContent / lastScale * newScale;
  const newScrollLeft = newMouseXInContent - mouseXInView;
  element.scrollLeft = newScrollLeft;
}

const colorMap: { [key: string]: string } = {};
const getColor: (name: string) => string = (name: string) => {
  if (colorMap[name] != undefined)
    return colorMap[name];
  colorMap[name] = `hsl(${Math.random() * 360}, ${Math.random() * 50 + 50}%, ${Math.random() * 40 + 30}%`;
  return colorMap[name];
};

function addProfileFunction(wrapper: HTMLDivElement, obj: any, yOffset: number): number {
  const name = obj.name;
  const start = obj.start;
  const end = obj.end;
  const innerCalls = obj.innerCalls;
  if (name === undefined || start === undefined || end === undefined || innerCalls === undefined)
    return yOffset;

  const div = document.createElement("div");
  div.style.boxSizing = "border-box";
  div.style.border = "1px solid rgba(0,0,0,0.1)"
  div.style.background = getColor(name);
  div.style.position = "absolute";
  div.style.overflow = "hidden";

  const text = document.createElement("span");
  text.textContent = `${name} ${Math.round((end - start) * 1000) / 1000}ms`;
  text.style.fontFamily = "sans-serif"
  text.style.padding = "2px";
  text.style.whiteSpace = "nowrap";
  text.style.textOverflow = "ellipsis";
  text.style.display = "inline-block";
  div.appendChild(text);

  const childOffset = yOffset + 1;
  wrapper.appendChild(div);
  obj.div = div;
  obj.yOffset = yOffset;
  let maxOffset = yOffset;
  for (const o of innerCalls)
    maxOffset = Math.max(maxOffset, addProfileFunction(wrapper, o, childOffset));
  return maxOffset;
}

function addProfile(obj: any) {
  const profWrapper = document.createElement("div");
  profWrapper.style.position = "relative";
  profWrapper.style.overflow = "scroll";
  profWrapper.style.border = "1px solid rgba(0,0,0,0.1)";
  let xScale = 1;

  profWrapper.addEventListener("wheel", (event: WheelEvent) => {
    if (event.ctrlKey) {
      event.preventDefault();
      const lastScale = xScale;
      xScale = Math.min(Math.max(xScale * (1 - event.deltaY / 50), 0.1), 10000);
      for (const o of obj)
        updateDivs(o, xScale);
      scrollToFraction(profWrapper, event, lastScale, xScale);
    }
  }, { passive: false });

  let maxOffset = 0;
  for (const o of obj)
    maxOffset = Math.max(maxOffset, addProfileFunction(profWrapper, o, 0));
  profWrapper.style.height = `${(maxOffset + 1.5) * ySize}px`;

  for (const o of obj)
    updateDivs(o, xScale);
  document.body.appendChild(profWrapper);
}


const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file && file.type === "application/json") {
    processFile(file);
  } else {
    alert("Please select a valid JSON file.");
  }
};

const createFileUploadHandler = () => {
  const inputElement = document.createElement("input");
  inputElement.type = "file";
  inputElement.accept = "application/json";
  document.body.appendChild(inputElement);
  inputElement.addEventListener("change", handleFileSelect);
  inputElement.click();
};

const processFile = (file: File) => {
  const reader = new FileReader();
  reader.onload = () => {
    let jsonObject;
    try {
      jsonObject = JSON.parse(reader.result as string);
      console.log(jsonObject);
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      alert("Invalid JSON file.");
      return;
    }
    addProfile(jsonObject);
  };
  reader.readAsText(file);
};

// Initiate the file upload handler
createFileUploadHandler();
