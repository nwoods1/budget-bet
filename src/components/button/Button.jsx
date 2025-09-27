// Hardcoded “+ New Group” button that opens the create-group modal.
import { useState } from "react";
import "./Button.css";
import GroupCreateModal from "../groupCreateModal/GroupCreateModal";

export default function Button() {
  const [open, setOpen] = useState(false);

  const handleCreate = (payload) => {
    // TODO: call your backend here
    console.log("Create group payload:", payload);
  };

  return (
    <>
      <button className="new-group-btn" onClick={() => setOpen(true)}>
        <span className="plus">+</span>
        New Group
      </button>

      <GroupCreateModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}