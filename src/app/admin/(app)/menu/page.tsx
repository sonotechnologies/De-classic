import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { ActButton } from "@/components/admin/act-button";
import { BranchPicker } from "@/components/admin/branch-picker";
import { ConfirmButton } from "@/components/admin/confirm";
import { ActionForm, CheckboxField, SubmitButton, TextField } from "@/components/admin/form";
import { EmptyState, PageHeader, Panel } from "@/components/admin/ui";
import { SampleTag } from "@/components/ui/bits";
import { db } from "@/db";
import { menuCategories, menuItems, type MenuItem } from "@/db/schema";
import { pickBranch } from "@/lib/admin-data";
import { CONTENT_ROLES, requireUser } from "@/lib/authz";
import { formatNaira, koboToNairaInput } from "@/lib/format";
import { addCategory, deleteCategory, deleteItem, moveCategory, renameCategory, saveItem, setItemAvailable } from "./actions";

export const metadata: Metadata = { title: "Bar menu" };

const small = "inline-flex h-9 items-center rounded-full border-[1.5px] border-ink bg-white px-3.5 text-sm font-semibold text-ink";
const summary = "cursor-pointer list-none text-sm font-semibold text-teal [&::-webkit-details-marker]:hidden";

function ItemFields({ item }: { item?: MenuItem }) {
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <TextField name="name" label="Item" defaultValue={item?.name} maxLength={80} />
        <TextField name="price" label="Price (₦)" inputMode="numeric" defaultValue={koboToNairaInput(item?.price)} placeholder="5000" />
      </div>
      <TextField
        name="description"
        label="Short description"
        hint="Optional, shown under the name."
        defaultValue={item?.description}
        maxLength={200}
      />
      <div className="flex flex-wrap gap-x-6">
        <CheckboxField name="isAvailable" label="Available tonight" defaultChecked={item?.isAvailable ?? true} />
        <CheckboxField name="isSample" label="Sample item" defaultChecked={item?.isSample ?? false} />
      </div>
    </>
  );
}

export default async function MenuAdminPage({ searchParams }: PageProps<"/admin/menu">) {
  const user = await requireUser(CONTENT_ROLES);
  const { branch: requested } = await searchParams;
  const { list, current } = await pickBranch(user, typeof requested === "string" ? requested : undefined);
  if (!current) return <EmptyState title="Add a branch first" body="Each branch has its own bar menu." />;

  const cats = await db.query.menuCategories.findMany({
    where: eq(menuCategories.branchId, current.id),
    orderBy: [asc(menuCategories.sortOrder), asc(menuCategories.name)],
    with: {
      items: { orderBy: [asc(menuItems.sortOrder), asc(menuItems.name)] },
    },
  });

  return (
    <>
      <PageHeader title="Bar menu" sub="Changes show on the website straight away" action={<BranchPicker branches={list} current={current.id} />} />

      {cats.length === 0 && (
        <EmptyState
          title="The menu is empty"
          body="The bar page hides the menu until you add at least one item. Start with a category, like cocktails."
        />
      )}

      {cats.map((c, ci) => (
        <Panel key={c.id}>
          <div className="bg-aqua-tint flex flex-wrap items-center justify-between gap-3 px-[18px] py-3">
            <span className="text-[15px] font-bold">{c.name.charAt(0).toUpperCase() + c.name.slice(1)}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <ActButton
                run={moveCategory.bind(null, c.id, -1)}
                label={`Move ${c.name} up`}
                disabled={ci === 0}
                className="border-line size-9 rounded-full border bg-white"
              >
                ↑
              </ActButton>
              <ActButton
                run={moveCategory.bind(null, c.id, 1)}
                label={`Move ${c.name} down`}
                disabled={ci === cats.length - 1}
                className="border-line size-9 rounded-full border bg-white"
              >
                ↓
              </ActButton>
              <details className="relative">
                <summary className={summary + " px-2"}>Rename</summary>
                <div className="rounded-card border-line absolute top-10 right-0 z-10 w-72 border bg-white p-4">
                  <ActionForm action={renameCategory.bind(null, c.id)} className="flex flex-col gap-3">
                    <TextField name="name" label="Category name" defaultValue={c.name} maxLength={40} />
                    <SubmitButton className="h-11 text-[15px]">Save</SubmitButton>
                  </ActionForm>
                </div>
              </details>
              <ConfirmButton
                quiet
                label="Delete"
                title={`Delete ${c.name}?`}
                body={`This removes the category and its ${c.items.length} item${c.items.length === 1 ? "" : "s"} from the bar page.`}
                confirmLabel="Delete category"
                run={deleteCategory.bind(null, c.id)}
                className="h-9"
              />
            </div>
          </div>
          {c.items.map((i) => (
            <div key={i.id} className="border-line border-t px-[18px] py-3">
              <div className="flex flex-wrap items-center gap-3 text-[15px]">
                <span className={`flex-1 ${i.isAvailable ? "" : "text-slate line-through"}`}>{i.name}</span>
                {i.isSample && <SampleTag />}
                {!i.isAvailable && <span className="text-slate text-[13px] font-semibold">Unavailable</span>}
                <span className="min-w-[72px] text-right font-semibold">{formatNaira(i.price)}</span>
                <ActButton
                  run={setItemAvailable.bind(null, i.id, !i.isAvailable)}
                  className="text-teal border-0 bg-transparent text-sm font-semibold"
                >
                  {i.isAvailable ? "Mark unavailable" : "Mark available"}
                </ActButton>
              </div>
              <details className="mt-1">
                <summary className={summary}>Edit</summary>
                <ActionForm action={saveItem.bind(null, c.id, i.id)} className="mt-3 flex max-w-[620px] flex-col gap-3">
                  <ItemFields item={i} />
                  <div className="flex flex-wrap items-center gap-2">
                    <SubmitButton className="h-11 text-[15px]">Save item</SubmitButton>
                    <ConfirmButton
                      quiet
                      label="Delete item"
                      title={`Delete ${i.name}?`}
                      body="It disappears from the bar page."
                      confirmLabel="Delete item"
                      run={deleteItem.bind(null, i.id)}
                    />
                  </div>
                </ActionForm>
              </details>
            </div>
          ))}
          <details className="border-line border-t px-[18px] py-3">
            <summary className={small + " list-none [&::-webkit-details-marker]:hidden"}>+ Item</summary>
            <ActionForm action={saveItem.bind(null, c.id, null)} resetOnSuccess className="mt-3 flex max-w-[620px] flex-col gap-3">
              <ItemFields />
              <SubmitButton className="h-11 self-start text-[15px]">Add item</SubmitButton>
            </ActionForm>
          </details>
        </Panel>
      ))}

      <section id="add-category" className="rounded-card border-slate flex max-w-[620px] flex-col gap-3 border border-dashed p-[18px]">
        <h2 className="m-0 text-base font-bold">Add category</h2>
        <ActionForm action={addCategory.bind(null, current.id)} resetOnSuccess className="flex flex-wrap items-end gap-3">
          <TextField name="name" label="Category name" placeholder="cocktails" maxLength={40} className="flex-[1_1_220px]" />
          <SubmitButton className="h-12">Add category</SubmitButton>
        </ActionForm>
      </section>
    </>
  );
}
