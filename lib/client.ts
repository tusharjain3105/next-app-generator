import "client-only";

export const downloadFile = (url: string, title?: string) => {
  var link = document.createElement("a");
  document.body.appendChild(link);
  link.href = url;
  if (title) {
    link.download = title;
  }
  link.click();
  document.body.removeChild(link);
};
