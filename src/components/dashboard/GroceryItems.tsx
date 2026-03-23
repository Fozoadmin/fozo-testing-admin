import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, Search } from "lucide-react";
import { toast } from "react-toastify";

const UNITS = ["piece", "kg", "g", "l", "ml", "dozen", "pack"] as const;

type ItemFormValues = {
  storeId: string;
  itemName: string;
  category: string;
  description: string;
  imageUrl: string;
  price: string;
  mrp: string;
  unit: (typeof UNITS)[number];
  quantityAvailable: string;
  totalQuantityListed: string;
  isActive: boolean;
  isInStock: boolean;
};

function ItemForm({
  f,
  setF,
  imgUploading,
  setImgUploading,
  stores,
  onImageUpload,
}: {
  f: ItemFormValues;
  setF: (v: ItemFormValues) => void;
  imgUploading: boolean;
  setImgUploading: (v: boolean) => void;
  stores: any[];
  onImageUpload: (file: File, setter: (url: string) => void, loadingSetter: (v: boolean) => void) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium">Store *</label>
        <select
          className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          value={f.storeId}
          onChange={(e) => setF({ ...f, storeId: e.target.value })}
        >
          <option value="">Select a store</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.store_name}
            </option>
          ))}
        </select>
      </div>
      <Input
        placeholder="Item Name *"
        value={f.itemName}
        onChange={(e) => setF({ ...f, itemName: e.target.value })}
      />
      <Input
        placeholder="Category *"
        value={f.category}
        onChange={(e) => setF({ ...f, category: e.target.value })}
      />
      <Input
        placeholder="Description"
        value={f.description}
        onChange={(e) => setF({ ...f, description: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Price (₹) *"
          type="number"
          value={f.price}
          onChange={(e) => setF({ ...f, price: e.target.value })}
        />
        <Input
          placeholder="MRP (₹) *"
          type="number"
          value={f.mrp}
          onChange={(e) => setF({ ...f, mrp: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Unit</label>
        <select
          className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          value={f.unit}
          onChange={(e) => setF({ ...f, unit: e.target.value as (typeof UNITS)[number] })}
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Qty Available"
          type="number"
          value={f.quantityAvailable}
          onChange={(e) => setF({ ...f, quantityAvailable: e.target.value })}
        />
        <Input
          placeholder="Total Qty Listed"
          type="number"
          value={f.totalQuantityListed}
          onChange={(e) => setF({ ...f, totalQuantityListed: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={f.isActive}
            onChange={(e) => setF({ ...f, isActive: e.target.checked })}
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={f.isInStock}
            onChange={(e) => setF({ ...f, isInStock: e.target.checked })}
          />
          In Stock
        </label>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Item Image</label>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            className="text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file)
                onImageUpload(
                  file,
                  (url) => setF({ ...f, imageUrl: url }),
                  setImgUploading
                );
            }}
          />
          {imgUploading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        {f.imageUrl && (
          <img src={f.imageUrl} alt="preview" className="h-20 rounded object-cover" />
        )}
      </div>
    </div>
  );
}

const emptyForm: ItemFormValues = {
  storeId: "",
  itemName: "",
  category: "",
  description: "",
  imageUrl: "",
  price: "",
  mrp: "",
  unit: "piece" as (typeof UNITS)[number],
  quantityAvailable: "0",
  totalQuantityListed: "0",
  isActive: true,
  isInStock: true,
};

export function GroceryItems() {
  const [items, setItems] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");

  // Add dialog
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [creating, setCreating] = useState(false);

  // Edit dialog
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editing, setEditing] = useState(false);

  // Delete dialog
  const [openDelete, setOpenDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Image upload
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editUploadingImage, setEditUploadingImage] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsData, storesData] = await Promise.all([
        adminApi.getAllGroceryItems(),
        adminApi.getAllGroceryStores(),
      ]);
      setItems(itemsData);
      setStores(storesData);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch grocery items");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.item_name
      ?.toLowerCase()
      .includes(searchFilter.toLowerCase());
    const matchesStore = storeFilter ? item.store_id === storeFilter : true;
    return matchesSearch && matchesStore;
  });

  const handleImageUpload = async (
    file: File,
    setter: (url: string) => void,
    loadingSetter: (v: boolean) => void
  ) => {
    loadingSetter(true);
    try {
      const { imageUrl } = await adminApi.uploadGroceryImage(file);
      setter(imageUrl);
      toast.success("Image uploaded");
    } catch (error: any) {
      toast.error(error.message || "Image upload failed");
    } finally {
      loadingSetter(false);
    }
  };

  const handleCreate = async () => {
    if (!form.itemName.trim()) return toast.error("Item name is required");
    if (!form.storeId.trim()) return toast.error("Store is required");
    if (!form.category.trim()) return toast.error("Category is required");
    if (!form.price || isNaN(Number(form.price))) return toast.error("Valid price is required");
    if (!form.mrp || isNaN(Number(form.mrp))) return toast.error("Valid MRP is required");

    setCreating(true);
    try {
      await adminApi.createGroceryItem({
        storeId: form.storeId,
        itemName: form.itemName,
        category: form.category,
        description: form.description || undefined,
        imageUrl: form.imageUrl || undefined,
        price: Number(form.price),
        mrp: Number(form.mrp),
        unit: form.unit,
        quantityAvailable: Number(form.quantityAvailable),
        totalQuantityListed: Number(form.totalQuantityListed),
        isActive: form.isActive,
        isInStock: form.isInStock,
      });
      toast.success("Grocery item created");
      setOpenAdd(false);
      setForm({ ...emptyForm });
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create item");
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (item: any) => {
    setSelectedItem(item);
    setEditForm({
      storeId: item.store_id || "",
      itemName: item.item_name || "",
      category: item.category || "",
      description: item.description || "",
      imageUrl: item.image_url || "",
      price: String(item.price || ""),
      mrp: String(item.mrp || ""),
      unit: item.unit || "piece",
      quantityAvailable: String(item.quantity_available ?? 0),
      totalQuantityListed: String(item.total_quantity_listed ?? 0),
      isActive: item.is_active ?? true,
      isInStock: item.is_in_stock ?? true,
    });
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    setEditing(true);
    try {
      await adminApi.updateGroceryItem(selectedItem.id, {
        itemName: editForm.itemName || undefined,
        category: editForm.category || undefined,
        description: editForm.description || undefined,
        imageUrl: editForm.imageUrl || undefined,
        price: editForm.price ? Number(editForm.price) : undefined,
        mrp: editForm.mrp ? Number(editForm.mrp) : undefined,
        unit: editForm.unit,
        quantityAvailable: Number(editForm.quantityAvailable),
        totalQuantityListed: Number(editForm.totalQuantityListed),
        isActive: editForm.isActive,
        isInStock: editForm.isInStock,
      });
      toast.success("Grocery item updated");
      setOpenEdit(false);
      setSelectedItem(null);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update item");
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteGroceryItem(itemToDelete.id);
      toast.success("Grocery item deleted");
      setOpenDelete(false);
      setItemToDelete(null);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete item");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Grocery Items</CardTitle>
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Grocery Item</DialogTitle>
                <DialogDescription>Add a new item to a grocery store.</DialogDescription>
              </DialogHeader>
              <ItemForm
                f={form}
                setF={setForm}
                imgUploading={uploadingImage}
                setImgUploading={setUploadingImage}
                stores={stores}
                onImageUpload={handleImageUpload}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenAdd(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="max-w-xs"
            />
            <select
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
            >
              <option value="">All Stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.store_name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground py-8"
                    >
                      No grocery items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.item_name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                          {item.item_name}
                        </div>
                      </TableCell>
                      <TableCell>{item.store_name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>₹{Number(item.price).toFixed(2)}</TableCell>
                      <TableCell>₹{Number(item.mrp).toFixed(2)}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.quantity_available}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={item.is_active ? "default" : "outline"}>
                            {item.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant={item.is_in_stock ? "default" : "secondary"}>
                            {item.is_in_stock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setItemToDelete(item);
                              setOpenDelete(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Grocery Item</DialogTitle>
            <DialogDescription>Update item details.</DialogDescription>
          </DialogHeader>
          <ItemForm
            f={editForm}
            setF={setEditForm}
            imgUploading={editUploadingImage}
            setImgUploading={setEditUploadingImage}
            stores={stores}
            onImageUpload={handleImageUpload}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={editing}>
              {editing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Grocery Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{itemToDelete?.item_name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
