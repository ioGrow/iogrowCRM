function idealTextColor(bgColor) {
    var nThreshold = 105;
    var components = getRGBComponents(bgColor);
    var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);

    return ((255 - bgDelta) < nThreshold) ? "#000000" : "#ffffff";
}
function getRGBComponents(color) {

    var r = color.substring(1, 3);
    var g = color.substring(3, 5);
    var b = color.substring(5, 7);

    return {
        R: parseInt(r, 16),
        G: parseInt(g, 16),
        B: parseInt(b, 16)
    };
}
function openDetailView(url) {
    var width = screen.width / 2;
    var height = screen.width / 2;
    var left = (screen.width / 2) - (width / 2);
    var top = (screen.height / 2) - (height / 2);
    var windowFeatures = "scrollbars=yes, resizable=yes, top=" + top + ", left=" + left +
        ", width=" + width + ", height=" + height + "menubar=no,resizable=no,status=no ";
    window.open(url, "_blank", windowFeatures);
};