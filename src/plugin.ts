import type { PluginMessageEvent } from "./model";

penpot.ui.open("RasterMan - Image Editor", `?theme=${penpot.theme}`, {
  width: 640,
  height: 380,
});

penpot.on("themechange", (theme) => {
  sendMessage({ type: "theme", content: theme });
});

penpot.on("selectionchange", () => {
  sendSelected();
});

function sendMessage(message: PluginMessageEvent) {
  penpot.ui.sendMessage(message);
}

penpot.ui.onMessage((message: any) => {
  if (message.type === "edited-image") {
    addToCanvas(message.data);
  }
});

async function addToCanvas(data: {
  image: Uint8Array;
  width: number;
  height: number;
}) {
  const image = await penpot.uploadMediaData(
    "edited-image",
    data.image,
    "image/png"
  );

  if (image) {
    penpot.ui.sendMessage({ type: "image-success" });
  }

  const rect = penpot.createRectangle();
  rect.x = penpot.viewport.center.x;
  rect.y = penpot.viewport.center.y;
  rect.resize(data.width, data.height);
  rect.fills = [{ fillOpacity: 1, fillImage: image }];
}

async function sendSelected() {
  penpot.ui.sendMessage({
    type: "changing-selection-start",
  });

  const image = penpot.selection.filter((e) => e.type === "rectangle")[0];

  if (image) {
    const exportedImage = await image.export({
      type: "png",
      scale: 1,
    });

    penpot.ui.sendMessage({
      type: "selection",
      data: exportedImage,
    });
  } else {
    penpot.ui.sendMessage({
      type: "changing-selection-end",
    });
  }
}

sendSelected();
