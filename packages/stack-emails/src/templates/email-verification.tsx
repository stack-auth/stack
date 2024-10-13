import { TEditorConfiguration } from "../editor/documents/editor/core";

export const emailVerificationTemplate: TEditorConfiguration = {
  "root": {
    "type": "EmailLayout",
    "data": {
      "backdropColor": "#ffffff",
      "canvasColor": "#FFFFFF",
      "textColor": "#242424",
      "fontFamily": null,
      "childrenIds": [
        "block_BjpQ7DGTtvaEuYRMd7VE7w",
        "block_xyg4GWmgGbJJEDRQc76bC",
        "block_76VptLCZ47t3EkAarUufEJ",
        "block_Gtk3kDYwsJqEmQf2XGWPRc",
        "block_LACDCzUS2bsvEbmnq1KHuW"
      ]
    }
  },
  "block_xyg4GWmgGbJJEDRQc76bC": {
    "type": "Text",
    "data": {
      "style": {
        "color": "#474849",
        "backgroundColor": null,
        "fontSize": 14,
        "fontFamily": null,
        "fontWeight": "normal",
        "textAlign": "center",
        "padding": {
          "top": 8,
          "bottom": 16,
          "right": 24,
          "left": 24
        }
      },
      "props": {
        "text": "Hi{{#if userDisplayName}}, {{ userDisplayName }}{{/if}}! Please click on the following button to verify your email.\n"
      }
    }
  },
  "block_76VptLCZ47t3EkAarUufEJ": {
    "type": "Button",
    "data": {
      "style": {
        "backgroundColor": null,
        "fontSize": 14,
        "fontFamily": null,
        "fontWeight": "bold",
        "textAlign": "center",
        "padding": {
          "top": 12,
          "bottom": 12,
          "right": 24,
          "left": 24
        }
      },
      "props": {
        "buttonBackgroundColor": "#f0f0f0",
        "buttonStyle": "rounded",
        "buttonTextColor": "#000000",
        "fullWidth": false,
        "size": "medium",
        "text": "Verify my email",
        "url": "{{ emailVerificationLink }}"
      }
    }
  },
  "block_BjpQ7DGTtvaEuYRMd7VE7w": {
    "type": "Heading",
    "data": {
      "props": {
        "text": "Verify your email at {{ projectDisplayName }}",
        "level": "h3"
      },
      "style": {
        "color": "#000000",
        "backgroundColor": null,
        "fontFamily": null,
        "fontWeight": "bold",
        "textAlign": "center",
        "padding": {
          "top": 16,
          "bottom": 16,
          "right": 24,
          "left": 24
        }
      }
    }
  },
  "block_Gtk3kDYwsJqEmQf2XGWPRc": {
    "data": {
      "props": {
        "lineColor": "#EEEEEE",
        "lineHeight": 1
      },
      "style": {
        "padding": {
          "top": 16,
          "left": 24,
          "right": 24,
          "bottom": 16
        },
        "backgroundColor": null
      }
    },
    "type": "Divider"
  },
  "block_LACDCzUS2bsvEbmnq1KHuW": {
    "type": "Text",
    "data": {
      "style": {
        "color": "#474849",
        "backgroundColor": null,
        "fontSize": 12,
        "fontFamily": null,
        "fontWeight": "normal",
        "textAlign": "center",
        "padding": {
          "top": 4,
          "bottom": 24,
          "right": 24,
          "left": 24
        }
      },
      "props": {
        "text": "If you were not expecting this email, you can safely ignore it."
      }
    }
  }
};
