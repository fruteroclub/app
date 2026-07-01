"use client";

import { type ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";

/**
 * Shared Privy provider for auth-aware client islands.
 *
 * Hard rule #4 (no onchain): this deliberately OMITS wagmi/viem/chains/contracts.
 * D-signup: Privy auth (email/social) with an embedded wallet created silently so
 * "Crea tu perfil" yields a real, verifiable identity with no web3 UI surfaced.
 */
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

export default function AppPrivyProvider({
  children,
}: {
  children: ReactNode;
}) {
  if (!PRIVY_APP_ID) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        embeddedWallets: {
          ethereum: {
            createOnLogin: "all-users",
          },
        },
        appearance: {
          showWalletLoginFirst: false,
        },
        loginMethods: ["email"],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
