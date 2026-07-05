"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import styles from "./AuthControl.module.css";

export function AuthControl() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (session?.user) {
    return (
      <div className={styles.control}>
        <span className={styles.email}>{session.user.email}</span>
        <button
          type="button"
          className={styles.button}
          onClick={() => signOut()}
        >
          Se deconnecter
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => signIn("google")}
    >
      Espace editeur
    </button>
  );
}
