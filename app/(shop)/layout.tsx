import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/cart/cart-drawer";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="relative flex min-h-screen flex-col pt-16">
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
