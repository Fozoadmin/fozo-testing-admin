import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { adminApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import type { GroceryCategory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

type CategoryForm = {
  name: string;
  imageUrl: string;
  isActive: boolean;
};

const emptyCategoryForm: CategoryForm = {
  name: '',
  imageUrl: '',
  isActive: true,
};

const RESERVED_ALL_CATEGORY_NAME = 'All';
const getImageUrl = (category: GroceryCategory) => category.image_url || category.imageUrl || '';
const getIsActive = (category: GroceryCategory) => category.is_active ?? category.isActive ?? true;
const isReservedAllCategory = (category: Pick<GroceryCategory, 'name'> | null | undefined) =>
  category?.name.trim().toLowerCase() === RESERVED_ALL_CATEGORY_NAME.toLowerCase();

function CategoryFormFields({
  form,
  setForm,
  uploading,
  onUpload,
  imageOnly = false,
}: {
  form: CategoryForm;
  setForm: Dispatch<SetStateAction<CategoryForm>>;
  uploading: boolean;
  onUpload: (file: File) => void;
  imageOnly?: boolean;
}) {
  return (
    <div className='space-y-3'>
      <Input
        placeholder='Category name *'
        value={form.name}
        disabled={imageOnly}
        onChange={e => setForm({ ...form, name: e.target.value })}
      />
      {imageOnly && (
        <p className='text-muted-foreground text-xs'>
          The All category is required by the app. Only its image can be changed.
        </p>
      )}

      <div className='space-y-2'>
        <label className='text-sm font-medium'>Category Image</label>
        <div className='flex items-center gap-2'>
          <input
            type='file'
            accept='image/*'
            className='text-sm'
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
          {uploading && <Loader2 className='h-4 w-4 animate-spin' />}
        </div>
        <Input
          placeholder='Image URL'
          value={form.imageUrl}
          onChange={e => setForm({ ...form, imageUrl: e.target.value })}
        />
        {form.imageUrl && (
          <img src={form.imageUrl} alt='Category preview' className='h-24 w-24 rounded object-cover' />
        )}
      </div>

      {!imageOnly && (
        <label className='flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={form.isActive}
            onChange={e => setForm({ ...form, isActive: e.target.checked })}
          />
          Active on grocery home
        </label>
      )}
    </div>
  );
}

export function GroceryCategories() {
  const [categories, setCategories] = useState<GroceryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState<CategoryForm>({ ...emptyCategoryForm });
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [openEdit, setOpenEdit] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<GroceryCategory | null>(null);
  const [editForm, setEditForm] = useState<CategoryForm>({ ...emptyCategoryForm });
  const [editing, setEditing] = useState(false);
  const [editUploading, setEditUploading] = useState(false);

  const [openDelete, setOpenDelete] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<GroceryCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAllGroceryCategories(true);
      setCategories(data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to fetch grocery categories'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(category => category.name.toLowerCase().includes(q));
  }, [categories, search]);

  const handleImageUpload = async (
    file: File,
    setImageUrl: (url: string) => void,
    setLoadingState: (value: boolean) => void
  ) => {
    setLoadingState(true);
    try {
      const { imageUrl } = await adminApi.uploadGroceryCategoryImage(file);
      setImageUrl(imageUrl);
      toast.success('Category image uploaded');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Image upload failed'));
    } finally {
      setLoadingState(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    if (form.name.trim().toLowerCase() === RESERVED_ALL_CATEGORY_NAME.toLowerCase()) {
      toast.error('All is a system category. Edit its image instead.');
      return;
    }

    setCreating(true);
    try {
      await adminApi.createGroceryCategory({
        name: form.name.trim(),
        imageUrl: form.imageUrl.trim() || undefined,
        isActive: form.isActive,
      });
      toast.success('Grocery category created');
      setOpenAdd(false);
      setForm({ ...emptyCategoryForm });
      await fetchCategories();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to create grocery category'));
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (category: GroceryCategory) => {
    setSelectedCategory(category);
    setEditForm({
      name: category.name,
      imageUrl: getImageUrl(category),
      isActive: getIsActive(category),
    });
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!selectedCategory) return;
    const isAllCategory = isReservedAllCategory(selectedCategory);
    if (!isAllCategory && !editForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setEditing(true);
    try {
      await adminApi.updateGroceryCategory(
        selectedCategory.id,
        isAllCategory
          ? {
              imageUrl: editForm.imageUrl.trim() || null,
            }
          : {
              name: editForm.name.trim(),
              imageUrl: editForm.imageUrl.trim() || null,
              isActive: editForm.isActive,
            }
      );
      toast.success('Grocery category updated');
      setOpenEdit(false);
      setSelectedCategory(null);
      await fetchCategories();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update grocery category'));
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    if (isReservedAllCategory(categoryToDelete)) {
      toast.error('All category cannot be hidden or deleted');
      setOpenDelete(false);
      setCategoryToDelete(null);
      return;
    }
    setDeleting(true);
    try {
      await adminApi.deleteGroceryCategory(categoryToDelete.id);
      toast.success('Grocery category hidden from app');
      setOpenDelete(false);
      setCategoryToDelete(null);
      await fetchCategories();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to delete grocery category'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>Grocery Categories</CardTitle>
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button size='sm'>
                <Plus className='mr-1 h-4 w-4' /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-lg'>
              <DialogHeader>
                <DialogTitle>Add Grocery Category</DialogTitle>
                <DialogDescription>
                  Categories appear in the grocery section of the customer app.
                </DialogDescription>
              </DialogHeader>
              <CategoryFormFields
                form={form}
                setForm={setForm}
                uploading={uploading}
                onUpload={file =>
                  handleImageUpload(
                    file,
                    imageUrl => setForm(current => ({ ...current, imageUrl })),
                    setUploading
                  )
                }
              />
              <DialogFooter>
                <Button variant='outline' onClick={() => setOpenAdd(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={creating || uploading}>
                  {creating ? <Loader2 className='mr-1 h-4 w-4 animate-spin' /> : null}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <div className='mb-4 flex items-center gap-2'>
            <Search className='text-muted-foreground h-4 w-4' />
            <Input
              placeholder='Search categories...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='max-w-xs'
            />
          </div>

          {loading ? (
            <div className='flex justify-center py-8'>
              <Loader2 className='h-6 w-6 animate-spin' />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Image URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className='text-muted-foreground py-8 text-center'>
                      No grocery categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map(category => {
                    const imageUrl = getImageUrl(category);
                    return (
                      <TableRow key={category.id}>
                        <TableCell className='font-medium'>
                          <div className='flex items-center gap-2'>
                            {imageUrl && (
                              <img
                                src={imageUrl}
                                alt={category.name}
                                className='h-10 w-10 rounded bg-muted object-cover'
                              />
                            )}
                            {category.name}
                            {isReservedAllCategory(category) && <Badge variant='outline'>System</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className='max-w-[360px] truncate'>{imageUrl || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={getIsActive(category) ? 'default' : 'outline'}>
                            {getIsActive(category) ? 'Active' : 'Hidden'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => openEditDialog(category)}
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                            {!isReservedAllCategory(category) && (
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => {
                                  setCategoryToDelete(category);
                                  setOpenDelete(true);
                                }}
                              >
                                <Trash2 className='text-destructive h-4 w-4' />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Edit Grocery Category</DialogTitle>
            <DialogDescription>
              {isReservedAllCategory(selectedCategory)
                ? 'Update the image shown for the required All category.'
                : 'Update the image and visibility shown in the customer app.'}
            </DialogDescription>
          </DialogHeader>
          <CategoryFormFields
            form={editForm}
            setForm={setEditForm}
            uploading={editUploading}
            imageOnly={isReservedAllCategory(selectedCategory)}
            onUpload={file =>
              handleImageUpload(
                file,
                imageUrl => setEditForm(current => ({ ...current, imageUrl })),
                setEditUploading
              )
            }
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpenEdit(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={editing || editUploading}>
              {editing ? <Loader2 className='mr-1 h-4 w-4 animate-spin' /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hide Grocery Category</DialogTitle>
            <DialogDescription>
              Hide <strong>{categoryToDelete?.name}</strong> from the customer app?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpenDelete(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className='mr-1 h-4 w-4 animate-spin' /> : null}
              Hide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
