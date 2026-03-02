import Link from "next/link";
import { Container } from "../ui/container"

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background py-12">
      <Container>
        <div className="container grid gap-12 md:grid-cols-3">
        {/* Brand */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold tracking-tighter">
            NOVA <span className="text-accent">FASHION</span>
          </h3>
          <p className="max-w-xs text-sm text-neutral-400">
            وجهتك الأولى للأزياء الفاخرة والعصرية. نحن نعيد تعريف الأناقة.
          </p>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-8 md:col-span-2">
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest">تصفح</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><Link href="/products?gender=men" className="hover:text-accent">الرجال</Link></li>
              <li><Link href="/products?gender=women" className="hover:text-accent">النساء</Link></li>
              <li><Link href="/products" className="hover:text-accent">أحدث التشكيلات</Link></li>
              <li><Link href="/about" className="hover:text-accent">عن العلامة</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest">المساعدة</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><Link href="/faq" className="hover:text-accent">الأسئلة الشائعة</Link></li>
              <li><Link href="/shipping" className="hover:text-accent">الشحن والتوصيل</Link></li>
              <li><Link href="/returns" className="hover:text-accent">سياسة الإرجاع</Link></li>
              <li><Link href="/contact" className="hover:text-accent">تواصل معنا</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Removed */}
      </div>

      <div className="mt-16 border-t border-white/5 pt-8 text-center text-xs text-neutral-500">
        <p>&copy; {new Date().getFullYear()} NOVA FASHION. جميع الحقوق محفوظة.</p>
      </div>
      </Container>
    </footer>
  )
}
