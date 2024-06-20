import { TEditorConfiguration } from "@/email/editor/documents/editor/core";

export const magicLinkTemplate: TEditorConfiguration = {
  "root": {
    "data": {
      "textColor": "#242424",
      "fontFamily": "MODERN_SANS",
      "canvasColor": "#FFFFFF",
      "childrenIds": [
        "block_BjpQ7DGTtvaEuYRMd7VE7w",
        "block_xyg4GWmgGbJJEDRQc76bC",
        "block_76VptLCZ47t3EkAarUufEJ",
        "block_Gtk3kDYwsJqEmQf2XGWPRc",
        "block_LACDCzUS2bsvEbmnq1KHuW"
      ],
      "backdropColor": "#F2F5F7"
    },
    "type": "EmailLayout"
  },
  "block_xyg4GWmgGbJJEDRQc76bC": {
    "data": {
      "props": {
        "text": "Hi{{#if userDisplayName}}, {{ userDisplayName }}{{/if}}! Please click on the following button to sign in."
      },
      "style": {
        "color": "#474849",
        "padding": {
          "top": 8,
          "left": 24,
          "right": 24,
          "bottom": 16
        },
        "fontSize": 14,
        "textAlign": "left",
        "fontFamily": null,
        "fontWeight": "normal",
        "backgroundColor": null
      }
    },
    "type": "Text"
  },
  "block_76VptLCZ47t3EkAarUufEJ": {
    "data": {
      "props": {
        "url": "{{ magicLink }}",
        "size": "medium",
        "text": "Sign in",
        "fullWidth": false,
        "buttonStyle": "rounded",
        "buttonTextColor": "#FFFFFF",
        "buttonBackgroundColor": "#000000"
      },
      "style": {
        "padding": {
          "top": 12,
          "left": 24,
          "right": 24,
          "bottom": 12
        },
        "fontSize": 14,
        "textAlign": "left",
        "fontFamily": null,
        "fontWeight": "bold",
        "backgroundColor": null
      }
    },
    "type": "Button"
  },
  "block_BjpQ7DGTtvaEuYRMd7VE7w": {
    "type": "Heading",
    "data": {
      "props": {
        "text": "Sign in to {{ projectDisplayName }}",
        "level": "h3"
      },
      "style": {
        "color": "#000000",
        "backgroundColor": null,
        "fontFamily": null,
        "fontWeight": "bold",
        "textAlign": "left",
        "padding": {
          "top": 32,
          "bottom": 0,
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
    "data": {
      "props": {
        "text": "If you were not expecting this email, you can safely ignore it."
      },
      "style": {
        "color": "#474849",
        "padding": {
          "top": 4,
          "left": 24,
          "right": 24,
          "bottom": 24
        },
        "fontSize": 12,
        "textAlign": "left",
        "fontFamily": null,
        "fontWeight": "normal",
        "backgroundColor": null
      }
    },
    "type": "Text"
  }
};
