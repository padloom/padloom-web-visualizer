chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "padloom-preview",
    title: "Preview on Padloom Mouse Pad",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "padloom-preview") {
    // Sayfa başlığını da alalım ki neyle ilgili olduğunu anlayalım
    chrome.tabs.sendMessage(tab.id, {
      action: "showPreview",
      imageUrl: info.srcUrl,
      pageTitle: tab.title // Sayfanın başlığı (Örn: Warhammer 40k Wallpapers)
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "downloadImage") {
    chrome.downloads.download({
      url: request.url,
      filename: 'padloom-custom-design.jpg',
      saveAs: true
    });
  }
});