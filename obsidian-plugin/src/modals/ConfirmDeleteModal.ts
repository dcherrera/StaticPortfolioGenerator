import { App, Modal, Setting } from "obsidian";

export class ConfirmDeleteModal extends Modal {
  private itemName: string;
  private itemType: string;
  private onConfirm: () => Promise<void>;

  constructor(
    app: App,
    itemName: string,
    itemType: string,
    onConfirm: () => Promise<void>
  ) {
    super(app);
    this.itemName = itemName;
    this.itemType = itemType;
    this.onConfirm = onConfirm;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: `Delete ${this.itemType}` });
    contentEl.createEl("p", {
      text: `Are you sure you want to delete "${this.itemName}"?`,
    });
    contentEl.createEl("p", {
      text: "This will delete all associated files and cannot be undone.",
      cls: "spg-delete-warning",
    });

    new Setting(contentEl)
      .addButton((btn) =>
        btn.setButtonText("Cancel").onClick(() => {
          this.close();
        })
      )
      .addButton((btn) =>
        btn
          .setButtonText("Delete")
          .setWarning()
          .onClick(async () => {
            await this.onConfirm();
            this.close();
          })
      );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
