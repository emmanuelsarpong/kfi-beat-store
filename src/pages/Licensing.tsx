import React from "react";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/Modal";

const Licensing: React.FC = () => {
  const nav = useNavigate();
  return (
    <Modal title="Licensing" onClose={() => nav(-1)}>
      <p>
        Our licensing is designed to be clear and flexible, covering common use
        cases from personal projects to commercial releases. Choose the license
        that fits your needs; if you require a custom license, reach out to us.
      </p>

      <h3 className="mt-6 mb-2 text-white font-semibold">License Types</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <span className="font-medium text-white">Basic:</span> Non-exclusive
          license for social content and personal projects. Credit appreciated.
        </li>
        <li>
          <span className="font-medium text-white">Standard:</span>{" "}
          Non-exclusive license for streaming releases and monetized content, up
          to a defined cap of streams/views.
        </li>
        <li>
          <span className="font-medium text-white">Premium:</span> Extended
          terms for wider commercial exploitation, broadcast, and higher caps.
        </li>
        <li>
          <span className="font-medium text-white">Exclusive:</span> Full
          buyout. Beat is removed from the store after purchase.
        </li>
      </ul>

      <h3 className="mt-6 mb-2 text-white font-semibold">Usage Rules</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          Reselling or redistributing stems or beats “as-is” is prohibited.
        </li>
        <li>
          Use must be transformative (e.g., vocals, additional production).
        </li>
        <li>No use in hateful, illegal, or infringing content.</li>
      </ul>

      <h3 className="mt-6 mb-2 text-white font-semibold">
        Stems & Deliverables
      </h3>
      <p>
        Depending on the license, you may receive master WAV, MP3, and
        multitrack stems via secure download links after purchase. Keep your
        links private.
      </p>

      <h3 className="mt-6 mb-2 text-white font-semibold">Attribution</h3>
      <p>
        Credit “KFI” where practical. For commercial releases, contact us for a
        preferred credit line and publishing splits if applicable.
      </p>

      <h3 className="mt-6 mb-2 text-white font-semibold">Support</h3>
      <p>
        Questions about license scope or upgrades? Email
        <a href="mailto:licensing@kfi.io" className="underline ml-1">
          licensing@kfi.io
        </a>
        .
      </p>

      <p className="mt-6 text-sm text-zinc-500">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </Modal>
  );
};

export default Licensing;
