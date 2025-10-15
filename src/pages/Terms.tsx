import React from "react";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/Modal";

const Terms: React.FC = () => {
  const nav = useNavigate();
  return (
    <Modal title="Terms of Service" onClose={() => nav(-1)}>
      <p>
        By accessing or using the KFI Beat Store, you agree to these Terms. If
        you do not agree, do not use the service. We may update these Terms from
        time to time; continued use means acceptance of changes.
      </p>

      <h3 className="mt-6 mb-2 text-white font-semibold">Use of Service</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          You must be at least 13 years old or the age of digital consent in
          your jurisdiction.
        </li>
        <li>
          You agree not to misuse the service, including interfering with its
          operation or security.
        </li>
        <li>
          We may suspend access if you violate these Terms or applicable law.
        </li>
      </ul>

      <h3 className="mt-6 mb-2 text-white font-semibold">
        Purchases & Refunds
      </h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          All sales are final unless required by law; please review previews
          before purchase.
        </li>
        <li>
          Downloads are delivered via secure links after successful payment.
        </li>
        <li>We may cancel an order and refund if fraud is suspected.</li>
      </ul>

      <h3 className="mt-6 mb-2 text-white font-semibold">
        Intellectual Property
      </h3>
      <p>
        All beats and related materials are owned by KFI or licensors. Your use
        is governed by the applicable license selected at checkout.
      </p>

      <h3 className="mt-6 mb-2 text-white font-semibold">
        Limitation of Liability
      </h3>
      <p>
        To the fullest extent permitted by law, KFI is not liable for indirect,
        incidental, consequential, or punitive damages, or any loss of data or
        profits arising from your use of the service.
      </p>

      <h3 className="mt-6 mb-2 text-white font-semibold">Governing Law</h3>
      <p>
        These Terms are governed by the laws of your principal place of business
        or residence, without regard to conflict-of-laws provisions.
      </p>

      <p className="mt-6 text-sm text-zinc-500">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </Modal>
  );
};

export default Terms;
