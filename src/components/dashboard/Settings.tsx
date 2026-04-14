/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsData extends Record<string, string> {
  // Financial & Pricing
  platformCommissionRate: string;
  handlingFeeFixed: string;
  deliveryFee: string;
  gstRate: string;
  referralAmount: string;
  groceryReferralAmount: string;
  freeDeliveryAovThreshold: string;

  // Operational & Logistics
  customerSearchRadiusKm: string;
  maxDeliveryRadiusKm: string;
  dpBaseFee: string;
  dpFeePerKm: string;
  restaurantConfirmTimeoutSeconds: string;

  // App Control & Kill Switches
  isOrderingDisabled: string;
  isPaymentGatewayDown: string;
  appUnderMaintenance: string;
  allowNewRegistrations: string;
  isGroceryEnabled: string;
  forceUpdateMinVersionIos: string;
  forceUpdateMinVersionAndroid: string;
  textForceUpdateMessage: string;
  urlAppStore: string;
  urlPlayStore: string;
  isWalletReferralEnabled: string;
  textWalletReferralDisabledMessage: string;

  // Content & Text
  textNoServiceInArea: string;
  textAppUnderMaintenance: string;
  textOrderingDisabled: string;
  supportPhoneNumber: string;
  supportEmail: string;
  urlPrivacyPolicy: string;
  urlTermsAndConditions: string;

  // Social Media
  socialInstagramUrl: string;
  socialFacebookUrl: string;
  socialTwitterUrl: string;
  socialLinkedinUrl: string;
}

export function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [originalSettings, setOriginalSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getSettings();
      const settingsData = data as unknown as SettingsData;
      setSettings(settingsData);
      // Store original settings for comparison
      setOriginalSettings({ ...settingsData });
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings || !originalSettings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Compare current settings with original to find only changed values
      const changedSettings: Record<string, string> = {};
      for (const key in settings) {
        if (
          Object.prototype.hasOwnProperty.call(settings, key) &&
          Object.prototype.hasOwnProperty.call(originalSettings, key)
        ) {
          const currentValue = settings[key];
          const originalValue = originalSettings[key];
          // Only include if value has changed
          if (currentValue !== originalValue) {
            changedSettings[key] = currentValue;
          }
        }
      }

      // If nothing changed, show message and return early
      if (Object.keys(changedSettings).length === 0) {
        setSuccess('No changes detected. Settings are already up to date.');
        setTimeout(() => setSuccess(null), 3000);
        setSaving(false);
        return;
      }

      // Only send changed settings to the backend
      const result = await adminApi.updateSettings(changedSettings);

      // Update original settings to reflect the saved state
      const updatedOriginal: SettingsData = { ...originalSettings };
      for (const key in changedSettings) {
        updatedOriginal[key as keyof SettingsData] = changedSettings[key];
      }
      setOriginalSettings(updatedOriginal);

      // Show success message with number of changed settings
      const changedCount = result.changedKeys?.length || Object.keys(changedSettings).length;
      setSuccess(`Successfully updated ${changedCount} setting(s)!`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SettingsData, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const toggleBooleanSetting = (key: keyof SettingsData) => {
    if (!settings) return;
    const currentValue = settings[key] === 'true';
    updateSetting(key, (!currentValue).toString());
  };

  if (loading) {
    return (
      <div className='flex h-full w-full items-center justify-center'>
        <div className='text-muted-foreground'>Loading settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className='flex h-full w-full items-center justify-center'>
        <div className='text-destructive'>Failed to load settings</div>
      </div>
    );
  }

  return (
    <div className='flex h-full w-full flex-col gap-6 overflow-y-auto p-6'>
      {/* User Profile Section */}
      <Card className='rounded-2xl'>
        <CardHeader className='pb-2'>
          <CardTitle>Admin Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='space-y-3'>
              <div>
                <label className='text-muted-foreground text-sm font-medium'>Full Name</label>
                <div className='mt-1 text-sm'>{user?.fullName || '—'}</div>
              </div>
              <div>
                <label className='text-muted-foreground text-sm font-medium'>Email</label>
                <div className='mt-1 text-sm'>{user?.email || '—'}</div>
              </div>
              <div>
                <label className='text-muted-foreground text-sm font-medium'>Phone Number</label>
                <div className='mt-1 text-sm'>{user?.phoneNumber || '—'}</div>
              </div>
            </div>
            <div className='space-y-3'>
              <div>
                <label className='text-muted-foreground text-sm font-medium'>User Type</label>
                <div className='mt-1 text-sm'>
                  <Badge variant='default' className='border-blue-200 bg-blue-100 text-blue-800'>
                    {user?.userType || '—'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className='text-muted-foreground text-sm font-medium'>Account Status</label>
                <div className='mt-1 text-sm'>
                  <Badge variant={user?.isActive ? 'default' : 'destructive'}>
                    {user?.isVerified ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className='text-muted-foreground text-sm font-medium'>
                  Verification Status
                </label>
                <div className='mt-1 text-sm'>
                  <Badge variant={user?.isVerified ? 'default' : 'secondary'}>
                    {user?.isVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Settings */}
      <Card className='rounded-2xl'>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>Configure platform-wide settings and preferences</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Financial & Pricing */}
          <div className='space-y-4'>
            <div>
              <h3 className='mb-3 text-lg font-semibold'>Financial & Pricing</h3>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <div className='space-y-2'>
                  <Label htmlFor='platformCommissionRate'>
                    Platform Commission Rate
                    <span className='text-muted-foreground ml-2 text-xs'>(0.0 to 1.0)</span>
                  </Label>
                  <Input
                    id='platformCommissionRate'
                    type='number'
                    step='0.01'
                    min='0'
                    max='1'
                    value={settings.platformCommissionRate}
                    onChange={e => updateSetting('platformCommissionRate', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='handlingFeeFixed'>Handling Fee (INR)</Label>
                  <Input
                    id='handlingFeeFixed'
                    type='number'
                    min='0'
                    value={settings.handlingFeeFixed}
                    onChange={e => updateSetting('handlingFeeFixed', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='gstRate'>
                    GST Rate
                    <span className='text-muted-foreground ml-2 text-xs'>(0.0 to 1.0)</span>
                  </Label>
                  <Input
                    id='gstRate'
                    type='number'
                    step='0.01'
                    min='0'
                    max='1'
                    value={settings.gstRate}
                    onChange={e => updateSetting('gstRate', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='referralAmount'>Restaurant Referral Amount (INR)</Label>
                  <Input
                    id='referralAmount'
                    type='number'
                    min='0'
                    value={settings.referralAmount || '0'}
                    onChange={e => updateSetting('referralAmount', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='groceryReferralAmount'>Grocery Referral Amount (INR)</Label>
                  <Input
                    id='groceryReferralAmount'
                    type='number'
                    min='0'
                    value={settings.groceryReferralAmount || '0'}
                    onChange={e => updateSetting('groceryReferralAmount', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='freeDeliveryAovThreshold'>
                    Average Order Value (AOV) for Free Delivery (INR)
                  </Label>
                  <Input
                    id='freeDeliveryAovThreshold'
                    type='number'
                    min='0'
                    value={settings.freeDeliveryAovThreshold || '0'}
                    onChange={e => updateSetting('freeDeliveryAovThreshold', e.target.value)}
                  />
                  <p className='text-muted-foreground text-xs'>
                    Orders with item total exceeding this amount (excluding all charges) get free
                    delivery.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Operational & Logistics */}
            <div>
              <h3 className='mb-3 text-lg font-semibold'>Operational & Logistics</h3>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                <div className='space-y-2'>
                  <Label htmlFor='customerSearchRadiusKm'>Customer Search Radius (km)</Label>
                  <Input
                    id='customerSearchRadiusKm'
                    type='number'
                    min='0'
                    value={settings.customerSearchRadiusKm}
                    onChange={e => updateSetting('customerSearchRadiusKm', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='maxDeliveryRadiusKm'>Max Delivery Radius (km)</Label>
                  <Input
                    id='maxDeliveryRadiusKm'
                    type='number'
                    min='0'
                    value={settings.maxDeliveryRadiusKm}
                    onChange={e => updateSetting('maxDeliveryRadiusKm', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='dpBaseFee'>DP Base Fee (INR)</Label>
                  <Input
                    id='dpBaseFee'
                    type='number'
                    min='0'
                    value={settings.dpBaseFee}
                    onChange={e => updateSetting('dpBaseFee', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='dpFeePerKm'>DP Fee Per Km (INR)</Label>
                  <Input
                    id='dpFeePerKm'
                    type='number'
                    min='0'
                    value={settings.dpFeePerKm}
                    onChange={e => updateSetting('dpFeePerKm', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='restaurantConfirmTimeoutSeconds'>
                    Restaurant Confirm Timeout (seconds)
                  </Label>
                  <Input
                    id='restaurantConfirmTimeoutSeconds'
                    type='number'
                    min='0'
                    value={settings.restaurantConfirmTimeoutSeconds}
                    onChange={e => updateSetting('restaurantConfirmTimeoutSeconds', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* App Control & Kill Switches */}
            <div>
              <h3 className='mb-3 text-lg font-semibold'>App Control & Kill Switches</h3>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='isOrderingDisabled'>Disable Ordering</Label>
                    <p className='text-muted-foreground text-sm'>
                      Users can browse but cannot place orders
                    </p>
                  </div>
                  <Switch
                    id='isOrderingDisabled'
                    checked={settings.isOrderingDisabled === 'true'}
                    onCheckedChange={() => toggleBooleanSetting('isOrderingDisabled')}
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='isPaymentGatewayDown'>Payment Gateway Down</Label>
                    <p className='text-muted-foreground text-sm'>
                      Show message that payments are unavailable
                    </p>
                  </div>
                  <Switch
                    id='isPaymentGatewayDown'
                    checked={settings.isPaymentGatewayDown === 'true'}
                    onCheckedChange={() => toggleBooleanSetting('isPaymentGatewayDown')}
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='appUnderMaintenance'>App Under Maintenance</Label>
                    <p className='text-muted-foreground text-sm'>
                      Global kill switch - shows maintenance screen
                    </p>
                  </div>
                  <Switch
                    id='appUnderMaintenance'
                    checked={settings.appUnderMaintenance === 'true'}
                    onCheckedChange={() => toggleBooleanSetting('appUnderMaintenance')}
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='allowNewRegistrations'>Allow New Registrations</Label>
                    <p className='text-muted-foreground text-sm'>
                      Enable/disable new customer/partner signups
                    </p>
                  </div>
                  <Switch
                    id='allowNewRegistrations'
                    checked={settings.allowNewRegistrations === 'true'}
                    onCheckedChange={() => toggleBooleanSetting('allowNewRegistrations')}
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='isGroceryEnabled'>Grocery Feature</Label>
                    <p className='text-muted-foreground text-sm'>
                      When disabled, the grocery tab and all grocery pages are hidden from users
                    </p>
                  </div>
                  <Switch
                    id='isGroceryEnabled'
                    checked={settings.isGroceryEnabled === 'true'}
                    onCheckedChange={() => toggleBooleanSetting('isGroceryEnabled')}
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='isWalletReferralEnabled'>Wallet Referral Toggle</Label>
                    <p className='text-muted-foreground text-sm'>
                      If enabled, the wallet/referral button in the mobile app will be unclickable.
                    </p>
                  </div>
                  <Switch
                    id='isWalletReferralEnabled'
                    checked={settings.isWalletReferralEnabled === 'true'}
                    onCheckedChange={() => toggleBooleanSetting('isWalletReferralEnabled')}
                  />
                </div>
              </div>
            </div>
            <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='forceUpdateMinVersionIos'>Force Update Min Version (iOS)</Label>
                <Input
                  id='forceUpdateMinVersionIos'
                  type='text'
                  placeholder='1.0.0'
                  value={settings.forceUpdateMinVersionIos}
                  onChange={e => updateSetting('forceUpdateMinVersionIos', e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='forceUpdateMinVersionAndroid'>
                  Force Update Min Version (Android)
                </Label>
                <Input
                  id='forceUpdateMinVersionAndroid'
                  type='text'
                  placeholder='1.0.0'
                  value={settings.forceUpdateMinVersionAndroid}
                  onChange={e => updateSetting('forceUpdateMinVersionAndroid', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Content & Text */}
          <div>
            <h3 className='mb-3 text-lg font-semibold'>Content & Text</h3>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='textNoServiceInArea'>No Service Message</Label>
                <Input
                  id='textNoServiceInArea'
                  type='text'
                  value={settings.textNoServiceInArea}
                  onChange={e => updateSetting('textNoServiceInArea', e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='textAppUnderMaintenance'>Maintenance Message</Label>
                <Input
                  id='textAppUnderMaintenance'
                  type='text'
                  value={settings.textAppUnderMaintenance}
                  onChange={e => updateSetting('textAppUnderMaintenance', e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='textOrderingDisabled'>Disable Order Message</Label>
                <Input
                  id='textOrderingDisabled'
                  type='text'
                  placeholder='Message shown when ordering is disabled'
                  value={settings.textOrderingDisabled}
                  onChange={e => updateSetting('textOrderingDisabled', e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='textWalletReferralDisabledMessage'>
                  Wallet Referral Disabled Message
                </Label>
                <Input
                  id='textWalletReferralDisabledMessage'
                  type='text'
                  placeholder='Currently this service is disabled'
                  value={settings.textWalletReferralDisabledMessage || ''}
                  onChange={e => updateSetting('textWalletReferralDisabledMessage', e.target.value)}
                />
                <p className='text-muted-foreground text-xs'>
                  Message shown to users when they click on the disabled wallet/referral button.
                </p>
              </div>
              <div className='mt-4 space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='textForceUpdateMessage'>Mobile App Update Message</Label>
                  <Input
                    id='textForceUpdateMessage'
                    type='text'
                    placeholder='A new version of the app is available. Please update to continue using the app.'
                    value={settings.textForceUpdateMessage}
                    onChange={e => updateSetting('textForceUpdateMessage', e.target.value)}
                  />
                  <p className='text-muted-foreground text-xs'>
                    Custom message shown to users when app update is required
                  </p>
                </div>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='urlAppStore'>App Store URL (iOS)</Label>
                    <Input
                      id='urlAppStore'
                      type='url'
                      placeholder='https://apps.apple.com/app/id...'
                      value={settings.urlAppStore}
                      onChange={e => updateSetting('urlAppStore', e.target.value)}
                    />
                    <p className='text-muted-foreground text-xs'>
                      Full App Store URL for iOS app updates
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='urlPlayStore'>Play Store URL (Android)</Label>
                    <Input
                      id='urlPlayStore'
                      type='url'
                      placeholder='https://play.google.com/store/apps/details?id=...'
                      value={settings.urlPlayStore}
                      onChange={e => updateSetting('urlPlayStore', e.target.value)}
                    />
                    <p className='text-muted-foreground text-xs'>
                      Full Play Store URL for Android app updates
                    </p>
                  </div>
                </div>
              </div>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='supportPhoneNumber'>Support Phone Number</Label>
                  <Input
                    id='supportPhoneNumber'
                    type='tel'
                    value={settings.supportPhoneNumber}
                    onChange={e => updateSetting('supportPhoneNumber', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='supportEmail'>Support Email</Label>
                  <Input
                    id='supportEmail'
                    type='email'
                    value={settings.supportEmail}
                    onChange={e => updateSetting('supportEmail', e.target.value)}
                  />
                </div>
              </div>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='urlPrivacyPolicy'>Privacy Policy URL</Label>
                  <Input
                    id='urlPrivacyPolicy'
                    type='url'
                    value={settings.urlPrivacyPolicy}
                    onChange={e => updateSetting('urlPrivacyPolicy', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='urlTermsAndConditions'>Terms & Conditions URL</Label>
                  <Input
                    id='urlTermsAndConditions'
                    type='url'
                    value={settings.urlTermsAndConditions}
                    onChange={e => updateSetting('urlTermsAndConditions', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Social Media */}
          <div>
            <h3 className='mb-1 text-lg font-semibold'>Social Media</h3>
            <p className='text-muted-foreground mb-3 text-sm'>
              Social media profile URLs displayed across the app
            </p>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='socialInstagramUrl'>Instagram URL</Label>
                <Input
                  id='socialInstagramUrl'
                  type='url'
                  placeholder='https://www.instagram.com/getfozo/'
                  value={settings.socialInstagramUrl}
                  onChange={e => updateSetting('socialInstagramUrl', e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='socialFacebookUrl'>Facebook URL</Label>
                <Input
                  id='socialFacebookUrl'
                  type='url'
                  placeholder='https://www.facebook.com/getfozo/'
                  value={settings.socialFacebookUrl}
                  onChange={e => updateSetting('socialFacebookUrl', e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='socialTwitterUrl'>Twitter (X) URL</Label>
                <Input
                  id='socialTwitterUrl'
                  type='url'
                  placeholder='https://x.com/getfozo'
                  value={settings.socialTwitterUrl}
                  onChange={e => updateSetting('socialTwitterUrl', e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='socialLinkedinUrl'>LinkedIn URL</Label>
                <Input
                  id='socialLinkedinUrl'
                  type='url'
                  placeholder='https://www.linkedin.com/company/getfozo/'
                  value={settings.socialLinkedinUrl}
                  onChange={e => updateSetting('socialLinkedinUrl', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className='bg-destructive/10 text-destructive rounded-md p-3 text-sm'>{error}</div>
          )}
          {success && (
            <div className='rounded-md bg-green-500/10 p-3 text-sm text-green-600'>{success}</div>
          )}

          {/* Save Button */}
          <div className='flex justify-end gap-2 pt-4'>
            <Button
              variant='outline'
              onClick={() => {
                if (originalSettings) {
                  setSettings({ ...originalSettings });
                  setError(null);
                  setSuccess(null);
                } else {
                  loadSettings();
                }
              }}
              disabled={saving}
            >
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
