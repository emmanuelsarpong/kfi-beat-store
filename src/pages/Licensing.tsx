import React from "react";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/Modal";

const Licensing: React.FC = () => {
  const nav = useNavigate();
  return (
    <Modal title="Licensing" onClose={() => nav(-1)}>
      <p>
        We offer several license options so you can choose the rights that fit
        your release. The on-site audio is a{" "}
        <span className="font-semibold text-white">tagged MP3 preview only</span>{" "}
        and is never delivered after purchase. All deliverables are clean
        masters and, for higher tiers, stems.
      </p>

      <h3 className="mt-6 mb-2 text-white font-semibold">License Types</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <span className="font-medium text-white">Starter License ($49):</span>{" "}
          Perfect for demos and independent releases. Delivers the clean master
          WAV file with entry-level usage rights.
        </li>
        <li>
          <span className="font-medium text-white">Premium License ($99):</span>{" "}
          Higher streaming and monetization limits while still delivering the
          same clean master WAV file.
        </li>
        <li>
          <span className="font-medium text-white">Unlimited License ($199):</span>{" "}
          Includes the master WAV <span className="font-semibold">plus track stems</span>{" "}
          for full creative control, where stems are available for that beat.
        </li>
        <li>
          <span className="font-medium text-white">Exclusive License:</span>{" "}
          One-time full buyout. Delivers WAV and stems and marks the beat as
          exclusively sold so it can no longer be purchased by others.
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
        Stems, Masters & Deliverables
      </h3>
      <p>
        After purchase you’ll receive secure, time-limited download links to the
        files included in your license:
      </p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>Starter: clean master WAV only.</li>
        <li>Premium: clean master WAV only.</li>
        <li>Unlimited: WAV + stems (where stems exist for that beat).</li>
        <li>Exclusive: WAV + stems and the beat is marked as sold.</li>
      </ul>
      <p className="mt-2">
        The preview MP3 you hear on the website is{" "}
        <span className="font-semibold text-white">for listening only</span> and
        is not part of any deliverable.
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
