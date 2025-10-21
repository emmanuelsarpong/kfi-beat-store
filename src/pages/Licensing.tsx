import React from "react";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/Modal";

const Licensing: React.FC = () => {
  const nav = useNavigate();
  return (
    <Modal title="Licensing" onClose={() => nav(-1)}>
      <p>
        We sell <span className="font-semibold text-white">exclusive</span>{" "}
        licenses only. Each beat is sold once as a full buyout and is
        permanently removed from the store after purchase. If you need to place
        a temporary hold or have questions before buying, get in touch via the
        contact form below.
      </p>

      <h3 className="mt-6 mb-2 text-white font-semibold">License Type</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <span className="font-medium text-white">
            Exclusive (Full Buyout):
          </span>{" "}
          Unlimited commercial usage across streaming, downloads, live
          performances, broadcast, and sync. One purchaser only; the beat is
          removed from the catalog at checkout.
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
        You will receive master WAV, MP3, and multitrack stems via secure
        download links after purchase. Keep your links private.
      </p>

      <h3 className="mt-6 mb-2 text-white font-semibold">Attribution</h3>
      <p>
        Credit “KFI” is appreciated but not required. For label releases,
        contact us if you need a preferred credit line or publishing split
        details.
      </p>

      <h3 className="mt-6 mb-2 text-white font-semibold">Support</h3>
      <p>
        Questions, holds, or bespoke terms?
        <a href="/#contact" className="underline ml-1">
          Contact us
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
