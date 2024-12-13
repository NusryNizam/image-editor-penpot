import type { PluginMessageEvent } from "./model";

penpot.ui.open("React example plugin", `?theme=${penpot.theme}`, {
  width: 800,
  height: 500,
});

penpot.on("themechange", (theme) => {
  sendMessage({ type: "theme", content: theme });
});

penpot.on("selectionchange", async () => {
  const image = penpot.selection.filter((e) => e.type === "rectangle")[0];

  // console.log("AAA", penpot.selection);

  if (image) {
    const exportedImage = await image.export({
      type: "png",
      scale: 1,
    });

    // console.log("IMAGE");
    // console.log(exportedImage);
    penpot.ui.sendMessage({
      type: "selection",
      data: exportedImage,
    });
  }
});

function sendMessage(message: PluginMessageEvent) {
  penpot.ui.sendMessage(message);
}
