const { Plugin, Notice } = require('obsidian');

module.exports = class ContextAwareDictionaryPlugin extends Plugin {
    async onload() {
        this.addCommand({
            id: 'smart-link-dictionary-lookup',
            name: 'Smart Dictionary Link (Lookup)',
            editorCallback: (editor) => {
                const selection = editor.getSelection();
                if (!selection) return;

                // 1. Locate your Dictionary file (Change name if needed)
                const dictFile = this.app.vault.getAbstractFileByPath("Dictionary.md") || 
                                 this.app.vault.getAbstractFileByPath("Glossary.md");

                if (!dictFile) {
                    new Notice("Error: Dictionary.md not found!");
                    return;
                }

                // 2. Get all headings from the file using Obsidian's instant cache
                const cache = this.app.metadataCache.getFileCache(dictFile);
                if (!cache || !cache.headings) {
                    new Notice("Dictionary has no headings!");
                    return;
                }

                // 3. Find the Best Match
                // We look for a heading that matches the START of your selection.
                // Example: Heading "Impoverish" matches Selection "Impoverished"
                const cleanSelection = selection.trim().toLowerCase();
                
                // Filter headings that are prefixes of the selection
                const matches = cache.headings
                    .map(h => h.heading) // Get the text only
                    .filter(h => cleanSelection.startsWith(h.toLowerCase()));

                // 4. Sort by length (Longest match wins)
                // If you have "Bee" and "Beekeeper", and select "Beekeepers", 
                // we want to link to "Beekeeper", not "Bee".
                matches.sort((a, b) => b.length - a.length);

                if (matches.length > 0) {
                    // Match found! Use the actual heading from the file.
                    const bestMatch = matches[0];
                    editor.replaceSelection(`[[Dictionary#${bestMatch}|${selection}]]`);
                    new Notice(`Linked to: ${bestMatch}`);
                } else {
                    // No match found in file. 
                    // Fallback: Just create a link to the selection itself, 
                    // or you can choose to do nothing.
                    const fallback = selection.charAt(0).toUpperCase() + selection.slice(1);
                    editor.replaceSelection(`[[Dictionary#${fallback}|${selection}]]`);
                    new Notice("New term linked (no partial match found).");
                }
            }
        });
    }
}
