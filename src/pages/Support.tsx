import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Phone, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import SEO from '@/components/common/SEO';

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    phone: z.string().min(10, {
        message: "Please enter a valid phone number.",
    }),
    message: z.string().min(10, {
        message: "Message must be at least 10 characters.",
    }),
});

const Support = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            message: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            await api.post('/contact', values);
            setIsSuccess(true);
            toast.success("Message sent successfully!");
            form.reset();
        } catch (error) {
            console.error(error);
            toast.error("Failed to send message. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Layout>
            <SEO
                title="Contact Us"
                description="Get in touch with MYUKCHEF. We're here to help with your orders, feedback, or any other inquiries."
            />

            <div className="min-h-screen bg-secondary/30 pt-20 pb-12">
                <div className="container max-w-5xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

                        {/* Left Side: Contact Info */}
                        <div className="space-y-8">
                            <div>
                                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                                    Support <span className="text-primary">Me</span>
                                </h1>
                                <p className="mt-4 text-lg text-muted-foreground">
                                    Have a question or feedback? We'd love to hear from you.
                                    Our team is here to help with orders, bookings and anything else.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">Email Us</h3>
                                        <a href="mailto:info@myukchef.com" className="text-muted-foreground underline">info@myukchef.com</a>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                                <h4 className="font-semibold text-primary mb-2">Our Promise</h4>
                                <p className="text-sm text-muted-foreground italic">
                                    "We strive to respond to all inquiries within 24 hours. Your satisfaction is our top priority."
                                </p>
                            </div>
                        </div>

                        {/* Right Side: Contact Form */}
                        <Card className="shadow-xl border-none">
                            <CardHeader>
                                <CardTitle className="text-2xl">Send a Message</CardTitle>
                                <CardDescription>
                                    Fill out the form below and we'll get back to you as soon as possible.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isSuccess ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
                                        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
                                        <p className="text-muted-foreground mb-8">
                                            Your message has been received. We'll be in touch shortly.
                                        </p>
                                        <Button onClick={() => setIsSuccess(false)} variant="outline">
                                            Send another message
                                        </Button>
                                    </div>
                                ) : (
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Full Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="John Doe" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Email Address</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="john@example.com" type="email" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="phone"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Phone Number</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="+44 7123 456789" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="message"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Your Message</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="How can we help you?"
                                                                className="min-h-[150px] resize-none"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="submit"
                                                className="w-full py-6 text-lg"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                        Sending...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        <Send className="h-5 w-5" />
                                                        Submit Request
                                                    </span>
                                                )}
                                            </Button>
                                        </form>
                                    </Form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Support;
