import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, uploadImage } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ImagePlus, Loader2, Save } from 'lucide-react';
import { DeliveryTiersEditor } from '@/components/admin/DeliveryTiersEditor';
import { BusinessRules } from '@/components/admin/BusinessRules';

const AdminSettings = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [logoUploading, setLogoUploading] = useState(false);

    const { data: settings = {}, isLoading } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: async () => api.get('/settings')
    });

    // Local state for each section
    const [storeInfo, setStoreInfo] = useState<any>({});
    const [footerInfo, setFooterInfo] = useState<any>({});
    const [opsStatus, setOpsStatus] = useState<any>({});
    const [deliveryConfig, setDeliveryConfig] = useState<any>({});
    const [loyaltyConfig, setLoyaltyConfig] = useState<any>({});
    const [planConfig, setPlanConfig] = useState<any>({});
    const [bankDetails, setBankDetails] = useState<any>({});
    const [companyInfo, setCompanyInfo] = useState<any>({});
    const [commission, setCommission] = useState<any>({});
    const [notificationConfig, setNotificationConfig] = useState<any>({});
    const [legalContent, setLegalContent] = useState<any>({});

    // Update local state when remote data loads
    useEffect(() => {
        if (settings) {
            setStoreInfo(settings.store_info || {});
            setFooterInfo(settings.footer_info || {});
            setOpsStatus(settings.operational_status || {});
            setDeliveryConfig(settings.delivery_config || {});
            setLoyaltyConfig(settings.loyalty_config || {});
            setPlanConfig(settings.meal_plan_config || {});
            setBankDetails(settings.company_bank_details || {});
            setCompanyInfo(settings.company_info || {});
            setCommission(settings.event_commission || {});
            setNotificationConfig({
                admin_alert_email: settings.admin_alert_email || 'info@myukchef.com',
                sms_sender: settings.sms_sender || 'MYUKCHEF'
            });
            setLegalContent({
                privacy_policy: settings.privacy_policy || "",
                terms_of_service: settings.terms_of_service || "",
                allergen_info: settings.allergen_info || ""
            });
        }
    }, [settings]);

    const updateSettingMutation = useMutation({
        mutationFn: async ({ key, value }: { key: string; value: any }) => {
            return api.post('/settings', { key, value });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            toast.success("Settings updated successfully");
        },
        onError: (error: any) => toast.error(error.message || "Failed to update settings")
    });

    const handleSave = (key: string, value: any) => {
        updateSettingMutation.mutate({ key, value });
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your store configurations and preferences.</p>
            </div>

            <Tabs defaultValue={new URLSearchParams(window.location.search).get("tab") ?? "general"} className="space-y-4">
                <TabsList className="flex h-auto w-full justify-start overflow-x-auto">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="operations">Operations</TabsTrigger>
                    <TabsTrigger value="delivery">Delivery</TabsTrigger>
                    <TabsTrigger value="plans">Meal Plans</TabsTrigger>
                    <TabsTrigger value="event-payments">Event Payments</TabsTrigger>
                    <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="legal">Legal & Info</TabsTrigger>
                    <TabsTrigger value="rules">Business rules</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Store Profile</CardTitle>
                            <CardDescription>Manage your restaurant's public information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-neutral-900">
                                    <img src={storeInfo.logo || '/logo.png'} alt="Logo" className="max-h-full max-w-full object-contain" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="store_logo" className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
                                        {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                                        {storeInfo.logo ? 'Change logo' : 'Upload logo'}
                                    </Label>
                                    <input
                                        id="store_logo"
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        className="sr-only"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            e.target.value = '';
                                            if (!file) return;
                                            setLogoUploading(true);
                                            try {
                                                setStoreInfo({ ...storeInfo, logo: await uploadImage(file) });
                                                toast.success('Logo uploaded. Save the profile to use it.');
                                            } catch (error) {
                                                toast.error(error instanceof Error ? error.message : 'Upload failed');
                                            } finally {
                                                setLogoUploading(false);
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">Shown at the top of every email. A PNG with a see-through background works best.</p>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="store_name">Store Name</Label>
                                <Input
                                    id="store_name"
                                    value={storeInfo.name || ""}
                                    onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="store_email">Contact Email</Label>
                                <Input
                                    id="store_email"
                                    value={storeInfo.email || ""}
                                    onChange={(e) => setStoreInfo({ ...storeInfo, email: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="store_phone">Phone Number</Label>
                                <Input
                                    id="store_phone"
                                    value={storeInfo.phone || ""}
                                    onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="store_address">Address</Label>
                                <Input
                                    id="store_address"
                                    value={storeInfo.address || ""}
                                    onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="store_description">Footer Description</Label>
                                <Input
                                    id="store_description"
                                    value={storeInfo.description || ""}
                                    onChange={(e) => setStoreInfo({ ...storeInfo, description: e.target.value })}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 px-6 py-4">
                            <Button
                                onClick={() => handleSave('store_info', storeInfo)}
                                disabled={updateSettingMutation.isPending}
                            >
                                {updateSettingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Profile
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Social Media & Hours</CardTitle>
                            <CardDescription>Manage your social presence and opening times shown in the footer.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="instagram">Instagram URL</Label>
                                    <Input
                                        id="instagram"
                                        placeholder="https://instagram.com/..."
                                        value={footerInfo.socials?.instagram || ""}
                                        onChange={(e) => setFooterInfo({ ...footerInfo, socials: { ...footerInfo.socials, instagram: e.target.value } })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="twitter">Twitter URL</Label>
                                    <Input
                                        id="twitter"
                                        placeholder="https://twitter.com/..."
                                        value={footerInfo.socials?.twitter || ""}
                                        onChange={(e) => setFooterInfo({ ...footerInfo, socials: { ...footerInfo.socials, twitter: e.target.value } })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="facebook">Facebook URL</Label>
                                    <Input
                                        id="facebook"
                                        placeholder="https://facebook.com/..."
                                        value={footerInfo.socials?.facebook || ""}
                                        onChange={(e) => setFooterInfo({ ...footerInfo, socials: { ...footerInfo.socials, facebook: e.target.value } })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="tiktok">TikTok URL</Label>
                                    <Input
                                        id="tiktok"
                                        placeholder="https://tiktok.com/@..."
                                        value={footerInfo.socials?.tiktok || ""}
                                        onChange={(e) => setFooterInfo({ ...footerInfo, socials: { ...footerInfo.socials, tiktok: e.target.value } })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <Label>Opening Hours (Footer display)</Label>
                                <div className="grid gap-2">
                                    {[0, 1, 2].map(idx => (
                                        <Input
                                            key={idx}
                                            placeholder={`Line ${idx + 1}`}
                                            value={footerInfo.hours?.[idx] || ""}
                                            onChange={(e) => {
                                                const hours = [...(footerInfo.hours || ["", "", ""])];
                                                hours[idx] = e.target.value;
                                                setFooterInfo({ ...footerInfo, hours });
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 px-6 py-4">
                            <Button
                                onClick={() => handleSave('footer_info', footerInfo)}
                                disabled={updateSettingMutation.isPending}
                            >
                                {updateSettingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Footer Content
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Operations Settings */}
                <TabsContent value="operations">
                    <Card>
                        <CardHeader>
                            <CardTitle>Operational Status</CardTitle>
                            <CardDescription>Control your kitchen availability and hours.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between space-x-2">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Kitchen Status</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Manually open or close the kitchen for new orders.
                                    </p>
                                </div>
                                <Switch
                                    checked={opsStatus.isOpen ?? true}
                                    onCheckedChange={(checked) => setOpsStatus({ ...opsStatus, isOpen: checked })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Estimated Preparation Time (mins)</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        type="number"
                                        className="w-24"
                                        value={opsStatus.prepTimeMin || 20}
                                        onChange={(e) => setOpsStatus({ ...opsStatus, prepTimeMin: parseInt(e.target.value) })}
                                    />
                                    <span>to</span>
                                    <Input
                                        type="number"
                                        className="w-24"
                                        value={opsStatus.prepTimeMax || 40}
                                        onChange={(e) => setOpsStatus({ ...opsStatus, prepTimeMax: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 px-6 py-4">
                            <Button
                                onClick={() => handleSave('operational_status', opsStatus)}
                                disabled={updateSettingMutation.isPending}
                            >
                                {updateSettingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Status
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Delivery Settings */}
                <TabsContent value="delivery">
                    <Card>
                        <CardHeader>
                            <CardTitle>Delivery Configuration</CardTitle>
                            <CardDescription>Set your delivery fees and minimum requirements.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="min_order">Minimum Order Amount (£)</Label>
                                <Input
                                    id="min_order"
                                    type="number"
                                    step="0.01"
                                    value={deliveryConfig.minOrder || 0}
                                    onChange={(e) => setDeliveryConfig({ ...deliveryConfig, minOrder: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="delivery_fee">Delivery Fee (£)</Label>
                                <Input
                                    id="delivery_fee"
                                    type="number"
                                    step="0.01"
                                    value={deliveryConfig.fee ?? 3.99}
                                    onChange={(e) => setDeliveryConfig({ ...deliveryConfig, fee: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="service_fee">Service Fee (%)</Label>
                                <Input
                                    id="service_fee"
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={deliveryConfig.serviceFeePercent ?? 10}
                                    onChange={(e) => setDeliveryConfig({ ...deliveryConfig, serviceFeePercent: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="free_delivery">Free Delivery Over (£)</Label>
                                <Input
                                    id="free_delivery"
                                    type="number"
                                    step="0.01"
                                    value={deliveryConfig.freeOver || 0}
                                    onChange={(e) => setDeliveryConfig({ ...deliveryConfig, freeOver: parseFloat(e.target.value) })}
                                />
                            </div>
                            <DeliveryTiersEditor value={deliveryConfig.tiers} onChange={(tiers) => setDeliveryConfig({ ...deliveryConfig, tiers })} />
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 px-6 py-4">
                            <Button
                                onClick={() => handleSave('delivery_config', deliveryConfig)}
                                disabled={updateSettingMutation.isPending}
                            >
                                {updateSettingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Delivery Rules
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Meal Plan Settings */}
                <TabsContent value="plans">
                    <Card>
                        <CardHeader>
                            <CardTitle>Meal Plans</CardTitle>
                            <CardDescription>Plans can be any length from 1 week to 6 months. Savings apply from 4 weeks, 13 weeks (3 months) and 26 weeks (6 months); plans under 4 weeks pay the standard price. New plans use these values. Existing plans keep what they agreed.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-3">
                            {[
                                ['discount1', 'Saving from 4 weeks (%)', 0],
                                ['discount3', 'Saving from 3 months / 13 weeks (%)', 5],
                                ['discount6', 'Saving for 6 months / 26 weeks (%)', 10],
                                ['cutoffHours', 'Change cut-off (hours before delivery)', 48],
                                ['leadDays', 'Earliest start (days from today)', 3],
                                ['deliveryFee', 'Delivery fee per week (£)', deliveryConfig.fee ?? 3.99],
                            ].map(([key, label, fallback]) => (
                                <div key={key as string} className="grid gap-2">
                                    <Label htmlFor={`plan-${key}`}>{label}</Label>
                                    <Input id={`plan-${key}`} type="number" inputMode="decimal" min={0} step="any" value={planConfig[key as string] ?? fallback} onChange={(e) => setPlanConfig({ ...planConfig, [key as string]: e.target.value === '' ? '' : Number(e.target.value) })} />
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 px-6 py-4">
                            <Button onClick={() => handleSave('meal_plan_config', planConfig)} disabled={updateSettingMutation.isPending}>Save meal plan settings</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Event Payment Settings */}
                <TabsContent value="event-payments">
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Payments</CardTitle>
                            <CardDescription>Customers pay the company in full, and you pay each chef their share. Customers see these bank details when they've confirmed their quotes.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            {[['accountName', 'Account name'], ['sortCode', 'Sort code'], ['accountNumber', 'Account number']].map(([key, label]) => (
                                <div key={key} className="grid gap-2">
                                    <Label htmlFor={`bank-${key}`}>{label}</Label>
                                    <Input id={`bank-${key}`} autoComplete="off" value={bankDetails[key] ?? ''} onChange={(e) => setBankDetails({ ...bankDetails, [key]: e.target.value })} />
                                </div>
                            ))}
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="bank-instructions">Extra payment instructions (optional)</Label>
                                <Input id="bank-instructions" value={bankDetails.instructions ?? ''} onChange={(e) => setBankDetails({ ...bankDetails, instructions: e.target.value })} />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 px-6 py-4">
                            <Button onClick={() => handleSave('company_bank_details', bankDetails)} disabled={updateSettingMutation.isPending}>Save bank details</Button>
                        </CardFooter>
                    </Card>
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>MYUKCHEF commission</CardTitle>
                            <CardDescription>The share you keep from each chef's quote. Chefs see this when quoting, and customers don't. Each booking keeps the rate in place when it was paid.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid max-w-xs gap-2">
                                <Label htmlFor="event-commission">Commission (%)</Label>
                                <Input id="event-commission" type="number" inputMode="decimal" min={0} max={100} step="0.5" value={commission.percent ?? 15} onChange={(e) => setCommission({ percent: e.target.value === '' ? '' : Number(e.target.value) })} />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 px-6 py-4">
                            <Button onClick={() => handleSave('event_commission', commission)} disabled={updateSettingMutation.isPending}>Save commission</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Loyalty Settings */}
                <TabsContent value="loyalty">
                    <Card>
                        <CardHeader>
                            <CardTitle>Loyalty Program</CardTitle>
                            <CardDescription>Configure how customers earn and redeem rewards.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between space-x-2">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Enable Points System</Label>
                                    <p className="text-sm text-muted-foreground"> allow customers to earn points on every purchase.</p>
                                </div>
                                <Switch
                                    checked={loyaltyConfig.enabled ?? true}
                                    onCheckedChange={(checked) => setLoyaltyConfig({ ...loyaltyConfig, enabled: checked })}
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="earn_ratio">Points per £1 spent</Label>
                                    <Input
                                        id="earn_ratio"
                                        type="number"
                                        value={loyaltyConfig.earnRatio || 10}
                                        onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, earnRatio: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="redeem_ratio">REDEMPTION: Points for £1 discount</Label>
                                    <Input
                                        id="redeem_ratio"
                                        type="number"
                                        value={loyaltyConfig.redeemRatio || 100}
                                        onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, redeemRatio: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 px-6 py-4">
                            <Button
                                onClick={() => handleSave('loyalty_config', loyaltyConfig)}
                                disabled={updateSettingMutation.isPending}
                            >
                                {updateSettingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Loyalty Rules
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Notifications Settings */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Settings</CardTitle>
                            <CardDescription>Configure how you and your customers receive alerts.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="sms_sender">SMS Sender Name</Label>
                                <Input
                                    id="sms_sender"
                                    placeholder="e.g. MYUKCHEF"
                                    value={notificationConfig.sms_sender || ""}
                                    onChange={(e) => setNotificationConfig({ ...notificationConfig, sms_sender: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">The name that appears on customer SMS messages (max 11 chars recommended).</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="admin_email">Admin Alert Email</Label>
                                <Input
                                    id="admin_email"
                                    type="email"
                                    placeholder="e.g. orders@yourdomain.com"
                                    value={notificationConfig.admin_alert_email || ""}
                                    onChange={(e) => setNotificationConfig({ ...notificationConfig, admin_alert_email: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">New order alerts will be sent to this address.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 px-6 py-4 space-x-2">
                            <Button
                                onClick={() => handleSave('sms_sender', notificationConfig.sms_sender)}
                                disabled={updateSettingMutation.isPending}
                            >
                                {updateSettingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save SMS Sender
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleSave('admin_alert_email', notificationConfig.admin_alert_email)}
                                disabled={updateSettingMutation.isPending}
                            >
                                {updateSettingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Email
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Legal Settings */}
                <TabsContent value="rules"><BusinessRules /></TabsContent>

                <TabsContent value="legal" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Company details</CardTitle>
                            <CardDescription>Shown in the site footer, Terms and Privacy Policy. Customers need to know who they're dealing with.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            {[['legalName', 'Registered company name'], ['companyNumber', 'Company number'], ['registeredAddress', 'Registered office address'], ['vatNumber', 'VAT number (if registered)'], ['icoNumber', 'ICO registration number']].map(([key, label]) => (
                                <div key={key} className="grid gap-2">
                                    <Label htmlFor={`company-${key}`}>{label}</Label>
                                    <Input id={`company-${key}`} value={companyInfo[key] ?? ''} onChange={(e) => setCompanyInfo({ ...companyInfo, [key]: e.target.value })} />
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 px-6 py-4">
                            <Button onClick={() => handleSave('company_info', companyInfo)} disabled={updateSettingMutation.isPending}>Save company details</Button>
                        </CardFooter>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Privacy Policy</CardTitle>
                            <CardDescription>Update the content of your privacy policy page.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                className="min-h-[200px] font-mono text-sm"
                                placeholder="Enter Privacy Policy content..."
                                value={legalContent.privacy_policy || ""}
                                onChange={(e) => setLegalContent({ ...legalContent, privacy_policy: e.target.value })}
                            />
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 px-6 py-4">
                            <Button
                                onClick={() => handleSave('privacy_policy', legalContent.privacy_policy)}
                                disabled={updateSettingMutation.isPending}
                            >
                                {updateSettingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Privacy Policy
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Terms of Service</CardTitle>
                            <CardDescription>Update the content of your terms and conditions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                className="min-h-[200px] font-mono text-sm"
                                placeholder="Enter Terms of Service content..."
                                value={legalContent.terms_of_service || ""}
                                onChange={(e) => setLegalContent({ ...legalContent, terms_of_service: e.target.value })}
                            />
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 px-6 py-4">
                            <Button
                                onClick={() => handleSave('terms_of_service', legalContent.terms_of_service)}
                                disabled={updateSettingMutation.isPending}
                            >
                                {updateSettingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Terms
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Allergen Information</CardTitle>
                            <CardDescription>Manage how allergen information is displayed to customers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                className="min-h-[200px] font-mono text-sm"
                                placeholder="Enter Allergen Info content..."
                                value={legalContent.allergen_info || ""}
                                onChange={(e) => setLegalContent({ ...legalContent, allergen_info: e.target.value })}
                            />
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 px-6 py-4">
                            <Button
                                onClick={() => handleSave('allergen_info', legalContent.allergen_info)}
                                disabled={updateSettingMutation.isPending}
                            >
                                {updateSettingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Allergen Info
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminSettings;
