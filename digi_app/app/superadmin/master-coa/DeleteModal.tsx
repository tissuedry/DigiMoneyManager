"use client";

import React, { useState } from "react";
import ModalWrapper from "./ModalWrapper";
import Toast from "@/components/toast";

export default function DeleteModal({ isOpen, onClose, data, type, onRefresh }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const getTitle = () => {
    if (type === 'akun') return "Hapus Akun";
    if (type === 'main') return "Hapus Main Kategori";
    if (type === 'sub') return "Hapus Sub Kategori";
    return "Hapus Data";
  };

  const getItemName = () => {
    if (type === 'akun') return `${data?.nomorAkun} - ${data?.namaAkun}`;
    return data?.nama || data?.main || data?.sub || "Item ini";
  };

  const getSuccessMessage = () => {
    if (type === 'main') return `Main "${getItemName()}" berhasil dihapus.`;
    if (type === 'sub') return `Sub "${getItemName()}" berhasil dihapus.`;
    return `${getItemName()} berhasil dihapus.`;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      let url = "";

      if (type === 'akun') {
        url = `/api/coa/${data?.id}`;
      } else {
        url = `/api/master/${data?.id}?type=${type}`;
      }

      const res = await fetch(url, {
        method: "DELETE",
      });

      const text = await res.text();
      const responseData = text ? JSON.parse(text) : {};

      if (!res.ok) {
        if (res.status === 404) {
          setSuccessMsg(getSuccessMessage());
          if (onRefresh) onRefresh();
          onClose();
          setShowSuccess(true);
          return;
        }
        throw new Error(responseData.message || "Gagal menghapus data");
      }

      setSuccessMsg(getSuccessMessage());
      if (onRefresh) onRefresh();
      onClose();
      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      actionLabel="Ya, Hapus"
      onAction={handleSubmit}
      isLoading={isLoading}
    >
      {errorMsg && (
        <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg mb-4">
          {errorMsg}
        </div>
      )}
      <p className="text-[14px] text-stone-700 leading-relaxed">
        Apakah Anda yakin ingin menghapus <strong>{getItemName()}</strong>? Data yang sudah dihapus tidak dapat dikembalikan.
      </p>
    </ModalWrapper>
    <Toast
      open={showSuccess}
      message={successMsg}
      onClose={() => setShowSuccess(false)}
    />
    </>
  );
}