import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from '@/hooks/use-toast';
import Section from './Section';
import { ADDRESS, PHONE } from '@/data/theatre';

const routes = [
  {
    q: 'На общественном транспорте',
    a: 'Трамваи 2, 4, 5 и троллейбус 7 — остановка «Театральная площадь», далее 3 минуты пешком по улице Красной.',
  },
  {
    q: 'На автомобиле',
    a: 'Парковка на 60 мест во дворе театра со стороны улицы Гимназической, для зрителей вечерних спектаклей бесплатно.',
  },
  {
    q: 'Работа кассы',
    a: 'Ежедневно с 11:00 до 20:00, перерыв 14:00–15:00. В дни спектаклей касса работает до начала последнего сеанса.',
  },
  {
    q: 'Возврат билетов',
    a: 'Не позднее чем за 3 дня до спектакля возвращаем полную стоимость, позже — по правилам ФЗ о культуре.',
  },
];

const Contacts = () => {
  const [form, setForm] = useState({ name: '', contact: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Укажите имя';
    if (form.contact.trim().length < 5) next.contact = 'Телефон или почта';
    if (form.message.trim().length < 10) next.message = 'Опишите вопрос подробнее';
    setErrors(next);
    if (Object.keys(next).length) return;
    toast({
      title: 'Сообщение отправлено',
      description: 'Администратор ответит в течение рабочего дня.',
    });
    setForm({ name: '', contact: '', message: '' });
  };

  return (
    <Section
      id="kontakty"
      eyebrow="Контакты и как добраться"
      title="Ждём вас на Красной, 118"
      lede="Позвоните в кассу, напишите администратору или просто приезжайте за час до спектакля — фойе открывается заранее."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-card p-5">
              <Icon name="MapPin" size={20} className="text-primary" />
              <p className="mt-3 font-head font-bold">Адрес</p>
              <p className="text-sm text-muted-foreground">{ADDRESS}</p>
            </div>
            <div className="rounded-2xl bg-card p-5">
              <Icon name="Phone" size={20} className="text-primary" />
              <p className="mt-3 font-head font-bold">Касса</p>
              <a
                href={`tel:${PHONE.replace(/[^+\d]/g, '')}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {PHONE}
              </a>
            </div>
            <div className="rounded-2xl bg-card p-5">
              <Icon name="Mail" size={20} className="text-primary" />
              <p className="mt-3 font-head font-bold">Почта</p>
              <a
                href="mailto:hello@helios-teatr.ru"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                hello@helios-teatr.ru
              </a>
            </div>
            <div className="rounded-2xl bg-card p-5">
              <Icon name="Clock" size={20} className="text-primary" />
              <p className="mt-3 font-head font-bold">Спектакли</p>
              <p className="text-sm text-muted-foreground">
                Ср–Вс, вечерние в 19:00
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-5">
            <Accordion type="single" collapsible defaultValue="item-0">
              {routes.map((r, i) => (
                <AccordionItem key={r.q} value={`item-${i}`} className="border-border">
                  <AccordionTrigger className="text-left font-head font-bold hover:no-underline">
                    {r.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {r.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        <form onSubmit={submit} noValidate className="rounded-2xl bg-card p-5 sm:p-6">
          <p className="font-head text-xl font-bold tracking-tightest">
            Написать администратору
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Групповые заявки, школьные показы и вопросы по броням.
          </p>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-name">Как к вам обращаться</Label>
              <Input
                id="c-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Мария"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-contact">Телефон или почта</Label>
              <Input
                id="c-contact"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="+7 900 000-00-00"
              />
              {errors.contact && (
                <p className="text-xs text-destructive">{errors.contact}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-msg">Сообщение</Label>
              <Textarea
                id="c-msg"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Хотим привести класс на «Кота в сапогах», 28 человек."
              />
              {errors.message && (
                <p className="text-xs text-destructive">{errors.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full rounded-full py-6 font-bold">
              Отправить
            </Button>
          </div>
        </form>
      </div>
    </Section>
  );
};

export default Contacts;
