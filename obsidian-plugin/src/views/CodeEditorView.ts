import { TextFileView, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_CODE = "code-editor-view";

export class CodeEditorView extends TextFileView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_CODE;
  }

  getDisplayText(): string {
    return this.file?.basename || "Code";
  }

  getViewData(): string {
    return this.data;
  }

  setViewData(data: string, clear: boolean): void {
    this.data = data;
    if (clear) {
      this.contentEl.empty();
    }

    // Create a simple text editor
    this.contentEl.empty();
    const container = this.contentEl.createDiv({ cls: "code-editor-container" });

    const textarea = container.createEl("textarea", {
      cls: "code-editor-textarea",
      attr: {
        spellcheck: "false",
      }
    });

    textarea.value = data;

    // Style the textarea
    textarea.style.width = "100%";
    textarea.style.height = "100%";
    textarea.style.resize = "none";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    textarea.style.fontFamily = "var(--font-monospace)";
    textarea.style.fontSize = "14px";
    textarea.style.lineHeight = "1.5";
    textarea.style.padding = "16px";
    textarea.style.backgroundColor = "var(--background-primary)";
    textarea.style.color = "var(--text-normal)";
    textarea.style.tabSize = "2";

    // Handle tab key
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + "  " + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        this.requestSave();
      }
    });

    // Save on change
    textarea.addEventListener("input", () => {
      this.data = textarea.value;
      this.requestSave();
    });

    // Style the container
    container.style.height = "100%";
    container.style.overflow = "auto";
  }

  clear(): void {
    this.data = "";
  }
}
