import React from "react";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/Modal";

const Privacy: React.FC = () => {
  const nav = useNavigate();
  return (
    <Modal title="Privacy Policy" onClose={() => nav(-1)}>
      <p>
        Your privacy matters. This Privacy Policy explains what information we
        collect, how we use it, and your choices. We aim to be transparent and
        respect your rights under applicable data protection laws.
      </p>

      <h3 className="mt-6 mb-2 text-white font-semibold">
        Information We Collect
      </h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>Account details you provide (name, email, and preferences).</li>
        <li>Purchase records (non-sensitive) and licensing selections.</li>
        <li>Usage data (pages viewed, actions, device info) for analytics.</li>
      </ul>

      <h3 className="mt-6 mb-2 text-white font-semibold">
        How We Use Information
      </h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>Provide, improve, and personalize the store experience.</li>
        <li>Process orders, deliver downloads, and enforce licensing terms.</li>
        <li>Detect and prevent misuse, fraud, and security incidents.</li>
        <li>Comply with legal obligations and respond to lawful requests.</li>
      </ul>

      <h3 className="mt-6 mb-2 text-white font-semibold">Cookies & Tracking</h3>
      <p>
        We use essential cookies for core functionality and analytics to
        understand aggregate usage. You can control cookies via your browser
        settings. We do not sell your personal data.
      </p>

      <h3 className="mt-6 mb-2 text-white font-semibold">Data Sharing</h3>
      <p>
        We share data only with trusted service providers (e.g., payment
        processors, hosting, analytics) under strict contractual safeguards. We
        do not share personal data with third parties for their own marketing.
      </p>

      <h3 className="mt-6 mb-2 text-white font-semibold">Your Rights</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>Access, correct, or delete your personal information.</li>
        <li>Object to processing or request restriction where applicable.</li>
        <li>Data portability where technically feasible.</li>
      </ul>

      <h3 className="mt-6 mb-2 text-white font-semibold">
        Retention & Security
      </h3>
      <p>
        We retain data only as long as necessary for the purposes outlined and
        implement technical and organizational measures to protect it.
      </p>

      <h3 className="mt-6 mb-2 text-white font-semibold">Contact</h3>
      <p>
        Questions or requests? Email{" "}
        <a href="mailto:privacy@kfi.io" className="underline">
          privacy@kfi.io
        </a>
        .
      </p>

      <p className="mt-6 text-sm text-zinc-500">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </Modal>
  );
};

export default Privacy;
