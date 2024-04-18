const { Plugin, Notice } = require('obsidian');
const { keymap } = require('@codemirror/view');

class ObsidianAutocorrector extends Plugin {
    onload() {
        console.log("ObsidianAutocorrector loaded");
        this.isEnabled = true; // Default state of auto-correction

        this.registerEditorExtension(
            keymap.of([
                {
                    key: "Mod-Shift-F6",
                    run: () => {
                        this.isEnabled = !this.isEnabled;
                        new Notice(this.isEnabled ? "Auto-correction is now enabled." : "Auto-correction is now disabled.");
                        return true;
                    }
                },
                {
                    key: "Space",
                    run: (view) => {
                        if (!this.isEnabled) {
                            return false;
                        }

                        const { state, dispatch } = view;
                        let cursorPos = state.selection.main.head;
                        let line = state.doc.lineAt(cursorPos);

                        let correctedText = this.autoCorrectText(line.text);

                        if (correctedText !== line.text) {
                            // Only dispatch the update if the text has changed
                            dispatch(state.update({
                                changes: {from: line.from, to: line.to, insert: correctedText},
                                selection: {anchor: cursorPos + (correctedText.length - line.text.length)}
                            }));
                        }

                        // Always insert a space after the corrected text
                        dispatch(state.update({
                            changes: {from: cursorPos + (correctedText.length - line.text.length), insert: " "},
                            selection: {anchor: cursorPos + (correctedText.length - line.text.length) + 1}
                        }));

                        return true;
                    }
                }
            ])
        );
    }

    autoCorrectText(text) {
        let correctedText = text;

        correctedText = correctedText.replace(/^(\s*)([-*]\s+)(\w)/gm, (match, p1, p2, p3) => `${p1}${p2}${p3.toUpperCase()}`);
        correctedText = correctedText.replace(/(\s)i(\s)(?!\s)/g, '$1I$2');
        correctedText = correctedText.replace(/\b(i')(\w+)\b/gi, (match, p1, p2) => `${p1.charAt(0).toUpperCase()}${p1.slice(1)}${p2.toLowerCase()}`);
        correctedText = correctedText.replace(/(^>\s*[^>\n]*?>?\s*)(\w)/gm, (match, p1, p2) => `${p1}${p2.toUpperCase()}`);
        correctedText = correctedText.replace(/([.!?])\s+(\w)/g, (match, p1, p2, offset, string) => {
            if (string.substr(offset - 2, 3) === '...') {
                return match;
            }
            return `${p1} ${p2.toUpperCase()}`;
        });
        correctedText = correctedText.replace(/^(.)|\.\s+(.)/g, (match) => match.toUpperCase());

        return correctedText;
    }
}

module.exports = ObsidianAutocorrector;