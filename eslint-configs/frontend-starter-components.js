module.exports = {
  "rules": {
    "react/forbid-elements": ["error", {
      "forbid": [
        { "element": "button", "message": "use <AsyncButton> instead" },
        { "element": "p", "message": "use <Paragraph body> instead" },
        { "element": "img", "message": "use <SmartImage> instead" },
        { "element": "a", "message": "use <SmartLink> instead" },
        { "element": "Image", "message": "use <SmartImage> instead" },
        { "element": "NextImage", "message": "use <SmartImage> instead" },
        { "element": "code", "message": "use <InlineCode> instead" },
        { "element": "div", "message": "use <Box> instead" },
        { "element": "h1", "message": "use <Paragraph h1> instead" },
        { "element": "h2", "message": "use <Paragraph h2> instead" },
        { "element": "h3", "message": "use <Paragraph h3> instead" },
        { "element": "h4", "message": "use <Paragraph h4> instead" },
        { "element": "h5", "message": "use <Paragraph h4 component='h5'> instead" },
        { "element": "h6", "message": "use <Paragraph h4 component='h6'> instead" },
      ],
    }],
  }
};
