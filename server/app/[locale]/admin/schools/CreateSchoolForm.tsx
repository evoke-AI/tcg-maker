'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CreateSchoolFormProps {
  onSuccess: () => void;
}

interface SchoolFormData {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export default function CreateSchoolForm({ onSuccess }: CreateSchoolFormProps) {
  const t = useTranslations('admin.schools');
  const common = useTranslations('common');
  
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof SchoolFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError(t('form.nameRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        ...(formData.code.trim() && { code: formData.code.trim() }),
        ...(formData.address.trim() && { address: formData.address.trim() }),
        ...(formData.phone.trim() && { phone: formData.phone.trim() }),
        ...(formData.email.trim() && { email: formData.email.trim() }),
        ...(formData.website.trim() && { website: formData.website.trim() }),
      };

      const response = await fetch('/api/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || t('form.createError'));
      }
    } catch (err) {
      setError(t('form.createError'));
      console.error('Error creating school:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('form.name')} *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={t('form.namePlaceholder')}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">{t('form.code')}</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => handleInputChange('code', e.target.value)}
            placeholder={t('form.codePlaceholder')}
            maxLength={20}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">{t('form.address')}</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('address', e.target.value)}
          placeholder={t('form.addressPlaceholder')}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">{t('form.phone')}</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder={t('form.phonePlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t('form.email')}</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder={t('form.emailPlaceholder')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">{t('form.website')}</Label>
        <Input
          id="website"
          type="url"
          value={formData.website}
          onChange={(e) => handleInputChange('website', e.target.value)}
          placeholder={t('form.websitePlaceholder')}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess()}
          disabled={loading}
        >
          {common('cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t('form.creating') : t('form.create')}
        </Button>
      </div>
    </form>
  );
} 