"use client";

import Link from "next/link";
import { useCart } from "@/features/cart/context";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function CartDrawer() {
  const { isOpen, items, removeItem, updateQuantity, closeCart } = useCart();
  const [isMounting, setIsMounting] = useState(true);

  // Prevent hydration error
  useEffect(() => {
    setIsMounting(false);
  }, []);

  if (isMounting) return null;

  // Simple drawer implementation without extra libs
  // In a real app, I'd use Radix Dialog/Sheet
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
       <div className="relative h-full w-full max-w-md bg-background border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-500">
         <div className="flex h-full flex-col">
           {/* Header */}
           <div className="flex items-center justify-between border-b border-white/5 p-4 flex-row-reverse">
             <h2 className="text-lg font-bold uppercase tracking-widest">حقيبة التسوق ({items.length})</h2>
             <Button variant="ghost" size="icon" onClick={closeCart}>
               <X className="h-5 w-5" />
             </Button>
           </div>

           {/* Items */}
           <div className="flex-1 overflow-y-auto p-4 space-y-6">
             {items.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                 <p className="mb-4">حقيبتك فارغة.</p>
                 <Button variant="outline" onClick={closeCart}>تابعي التسوق</Button>
               </div>
             ) : (
               items.map((item) => (
                 <div key={`${item.productId}-${item.variantId}-${item.size}`} className="flex gap-4 flex-row-reverse">
                   <div className="relative aspect-square h-16 w-16 min-w-[4rem] overflow-hidden rounded-md border bg-neutral-100">
                  {item.productSnapshot?.images?.[0] && (
                     <Image
                      src={item.productSnapshot.images[0]}
                      alt={item.productSnapshot.name || "Product"}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col text-right">
                  <div>
                    <div className="flex justify-between flex-row-reverse">
                      <h3 className="text-sm font-medium">{item.productSnapshot?.name || "منتج"}</h3>
                      <p className="text-sm font-semibold">{item.productSnapshot?.price?.amount?.toLocaleString()} {item.productSnapshot?.price?.currency}</p>
                    </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        المقاس: {item.size}
                      </p>
                  </div>
                     <div className="flex items-center justify-between flex-row-reverse mt-2">
                        <div className="flex items-center border border-white/10 rounded-sm">
                          <button 
                            onClick={() => updateQuantity(item.productId, item.variantId, item.size, item.quantity - 1)}
                            className="px-2 py-1 text-xs hover:bg-white/5 transition-colors"
                          >-</button>
                          <span className="px-2 text-xs">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.productId, item.variantId, item.size, item.quantity + 1)}
                            className="px-2 py-1 text-xs hover:bg-white/5 transition-colors"
                          >+</button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.productId, item.variantId, item.size)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          حذف
                        </button>
                     </div>
                   </div>
                 </div>
               ))
             )}
           </div>

           {/* Footer */}
           {items.length > 0 && (
             <div className="border-t border-white/5 p-4 space-y-4 bg-background">
               <div className="flex justify-between text-base font-medium flex-row-reverse">
                 <span className="uppercase tracking-wider">المجموع الفرعي</span>
                 <span>
                   {items.reduce((acc, item) => acc + (item.quantity * (item.productSnapshot?.price?.amount || 0)), 0).toLocaleString()} {items[0]?.productSnapshot?.price?.currency || 'EGP'}
                 </span>
               </div>
               <p className="text-xs text-muted-foreground text-center">يتم حساب الضرائب والشحن عند الدفع.</p>
               <Link href="/checkout" onClick={closeCart}>
                <Button className="w-full" variant="luxury" size="lg">إتمام الشراء</Button>
               </Link>
             </div>
           )}
         </div>
       </div>
    </div>
  );
}
