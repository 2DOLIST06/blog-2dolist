import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'About | Body Training Guide',
  description:
    'Body Training Guide is a blog about strength training, fitness, and sports that involve the body and muscles.',
  path: '/about'
});

export default function AboutPage() {
  return (
    <Container>
      <section className="py-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold text-slate-950">About Body Training Guide</h1>

          <p className="mt-6 text-slate-700">
            Body Training Guide is a blog about strength training, fitness, and sports that involve the body.
          </p>

          <p className="mt-4 text-slate-700">
            The goal is simple: to help people better understand training, muscles, exercises, and the methods used to
            make progress. The site is made for people who want to train with more logic, whether their goal is to build
            muscle, lose fat, improve their fitness, or simply use their body better.
          </p>

          <h2 className="mt-10 text-2xl font-bold text-slate-950">A simple approach to training</h2>

          <p className="mt-4 text-slate-700">
            Strength training can quickly become confusing. There are many programs, methods, tips, and opinions. Body
            Training Guide aims to put things back in order with clear content that is easy to follow and focused on
            what really matters.
          </p>

          <p className="mt-4 text-slate-700">
            Each article is designed to explain a useful topic: a muscle group, an exercise, a training method, a common
            mistake, a workout program, or a concept related to the body.
          </p>

          <p className="mt-4 text-slate-700">
            The idea is not to sell a miracle method. The idea is to give solid basics so people can better understand
            what they are doing when they train.
          </p>

          <h2 className="mt-10 text-2xl font-bold text-slate-950">
            Strength training, fitness, and sports related to the body
          </h2>

          <p className="mt-4 text-slate-700">
            The blog first focuses on strength training, because it helps develop strength, muscle, and movement
            control. But the body is not limited to dumbbells, machines, or gym exercises.
          </p>

          <p className="mt-4 text-slate-700">
            Body Training Guide also covers fitness, physical conditioning, bodyweight training, mobility, functional
            exercises, and sports where muscles play a direct role in performance.
          </p>

          <p className="mt-4 text-slate-700">
            The main idea stays the same: understand how the body works and how training can be organized in a more
            effective way.
          </p>

          <h2 className="mt-10 text-2xl font-bold text-slate-950">Content made to be useful</h2>

          <p className="mt-4 text-slate-700">
            The articles are written in a direct style, without unnecessary text. The goal is not to fill pages with
            words, but to answer a question clearly.
          </p>

          <p className="mt-4 text-slate-700">You will find content about:</p>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
            <li>the muscle groups of the body;</li>
            <li>strength training exercises;</li>
            <li>workout programs;</li>
            <li>common mistakes to avoid;</li>
            <li>the basics of progression;</li>
            <li>the role of muscles in different movements;</li>
            <li>the links between strength, posture, mobility, and performance.</li>
          </ul>

          <p className="mt-4 text-slate-700">
            Each topic follows a simple logic: explain, organize, then help people take action.
          </p>

          <h2 className="mt-10 text-2xl font-bold text-slate-950">Who is Body Training Guide for?</h2>

          <p className="mt-4 text-slate-700">
            Body Training Guide is for beginners who want to understand the basics, but also for people who already
            train and want to structure their workouts better.
          </p>

          <p className="mt-4 text-slate-700">
            The site can be useful if you want to know which muscle works during an exercise, how to organize a workout,
            why a movement matters, or how to build a more consistent progression.
          </p>

          <p className="mt-4 text-slate-700">
            The goal is not to replace a coach, a health professional, or personalized guidance. The blog is meant to be
            a guide to better understand the body and training.
          </p>

          <h2 className="mt-10 text-2xl font-bold text-slate-950">Our vision</h2>

          <p className="mt-4 text-slate-700">
            Training should not be confusing. Good training often starts with simple things: knowing what you want to
            work on, choosing the right exercises, making steady progress, and respecting the limits of your body.
          </p>

          <p className="mt-4 text-slate-700">
            Body Training Guide follows this approach: less noise, more clarity.
          </p>

          <p className="mt-4 text-slate-700">
            The site is built around one central idea: understanding your body helps you train better.
          </p>
        </div>
      </section>
    </Container>
  );
}
