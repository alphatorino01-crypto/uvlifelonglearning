<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\LearningModule;
use App\Models\Lesson;
use Illuminate\Database\Seeder;

class LearningContentSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            [
                'title' => 'Digital confidence',
                'slug' => 'digital-confidence',
                'description' => 'Build the everyday digital skills to work smarter, stay safe, and feel at home online.',
                'color' => 'blue',
                'courses' => [
                    [
                        'title' => 'Everyday digital essentials',
                        'slug' => 'everyday-digital-essentials',
                        'summary' => 'Get comfortable with the tools you use every day, from files and browsers to video calls.',
                        'instructor' => 'Sam Rivera',
                        'level' => 'Beginner',
                        'duration' => 80,
                        'lessons' => [
                            ['Getting started online', 'A friendly tour of your browser, search, and the web.', 'The internet is a collection of connected computers that share information. A browser is the app you use to explore it. Common browsers include Chrome, Safari, Firefox, and Edge.', 'Start with the address bar at the top of your browser. You can enter a website address or type a question to search the web. Look for a lock icon beside the address to check whether a connection is secure.'],
                            ['Organize your digital workspace', 'Find, save, and organize the files you use every day.', 'Files are stored in folders so you can find them again. A simple, consistent folder structure makes a big difference when your work starts to grow.', 'Try naming a folder by project or year, then choose descriptive names for the files inside it. Most devices have a search feature that can help you find a file when you forget where you saved it.'],
                            ['Connect with video calls', 'Join a meeting, share your screen, and feel more confident on camera.', 'Before a video call, check your camera, microphone, and internet connection. Muting your microphone when you are not speaking helps everyone hear the conversation clearly.', 'Use headphones to reduce echo. When you need to show a document or presentation, use the screen-share control and choose just the window you want people to see.'],
                        ],
                    ],
                    [
                        'title' => 'Stay safe online',
                        'slug' => 'stay-safe-online',
                        'summary' => 'Learn to protect your accounts and recognize the messages that deserve a second look.',
                        'instructor' => 'Maya Chen',
                        'level' => 'Beginner',
                        'duration' => 65,
                        'lessons' => [
                            ['Create stronger passwords', 'Build a practical password habit that protects the accounts you care about.', 'A strong password is long, unique, and difficult to guess. Reusing the same password across multiple sites puts every account at risk if one site is compromised.', 'A password manager can create and remember unique passwords for you. Turn on multi-factor authentication where it is available for an extra layer of account protection.'],
                            ['Spot suspicious messages', 'Recognize common warning signs in emails, texts, and websites.', 'Unexpected urgency, unfamiliar senders, and links asking for personal details are all reasons to pause. A message that looks like it comes from a trusted organization can still be misleading.', 'Do not use the contact details or links in a suspicious message. Instead, visit the organization website directly or call the number on your card or a recent statement.'],
                            ['Share thoughtfully', 'Make informed choices about what you post and who can see it.', 'Information shared online can travel further than you expect. Review the audience and privacy settings before posting personal details, photos, or your location.', 'If a post would cause you concern if it became public, take a moment to reconsider. You can always share something more privately after checking the settings.'],
                        ],
                    ],
                ],
            ],
            [
                'title' => 'Creative practice',
                'slug' => 'creative-practice',
                'description' => 'Explore visual storytelling and turn clear ideas into thoughtful, memorable designs.',
                'color' => 'orange',
                'courses' => [
                    [
                        'title' => 'Design thinking in practice',
                        'slug' => 'design-thinking-in-practice',
                        'summary' => 'Use a people-first process to understand a problem and turn ideas into better experiences.',
                        'instructor' => 'Jordan Ellis',
                        'level' => 'Intermediate',
                        'duration' => 95,
                        'lessons' => [
                            ['Start with the people', 'Learn to uncover what people actually need before you start designing.', 'Design thinking starts with curiosity about people. Observing how someone approaches a task often reveals needs they might not think to mention.', 'Try an open question such as “Tell me about the last time you did this.” Listen without jumping in with a solution. Look for recurring frustrations and workarounds.'],
                            ['Turn observations into insights', 'Find the useful patterns hidden in your notes and conversations.', 'One conversation is a story; a collection of conversations can reveal a pattern. Group similar observations to see what is making the experience difficult.', 'A useful insight connects a real need with its context. Try framing a need from the person’s point of view, without naming a solution yet.'],
                            ['Make a small prototype', 'Explore an idea early, with something simple you can test and change.', 'A prototype is an early, inexpensive way to explore an idea. A rough sketch, paper layout, or sample conversation can help you see how an idea might feel.', 'Choose the smallest version of your idea that lets someone react to it. Watch how they use it and ask what they expected to happen next.'],
                        ],
                    ],
                    [
                        'title' => 'Visual storytelling',
                        'slug' => 'visual-storytelling',
                        'summary' => 'Combine layout, color, and type to make information easier to understand and remember.',
                        'instructor' => 'Taylor Brooks',
                        'level' => 'All levels',
                        'duration' => 75,
                        'lessons' => [
                            ['Lead with a clear message', 'Make the most important idea the first thing your audience notices.', 'A visual story starts with a single message. Decide what you want the audience to understand or do before choosing images and decoration.', 'Give the key message room to breathe. Strong hierarchy helps people find their way through the rest of the information.'],
                            ['Build a visual hierarchy', 'Use scale, spacing, and contrast to guide the eye.', 'Visual hierarchy is the order in which people notice things. Size, position, color, and spacing all help communicate which elements matter most.', 'Try squinting at your work or looking at it from a distance. If the main message no longer stands out, strengthen its contrast or give it more space.'],
                            ['Use color with intention', 'Choose color combinations that feel consistent and stay readable.', 'Color sets a mood, groups related information, and draws attention. A small, consistent palette is often easier to use than a different color for every element.', 'Make sure text remains easy to read against its background. Never rely on color alone to explain a status or distinguish two choices.'],
                        ],
                    ],
                ],
            ],
            [
                'title' => 'Work & life',
                'slug' => 'work-and-life',
                'description' => 'Grow practical skills for focused work, thoughtful collaboration, and more sustainable routines.',
                'color' => 'green',
                'courses' => [
                    [
                        'title' => 'Focus & better habits',
                        'slug' => 'focus-and-better-habits',
                        'summary' => 'Build realistic routines to protect your focus and make steady progress on what matters.',
                        'instructor' => 'Avery Patel',
                        'level' => 'All levels',
                        'duration' => 70,
                        'lessons' => [
                            ['Make space for focus', 'Notice distractions and make it easier to work on one thing at a time.', 'Focus is easier when you decide what deserves your attention before the day gets busy. A clear, small goal gives your work session a helpful direction.', 'Silence unnecessary notifications, close unrelated tabs, and keep a note for the tasks that pop into your head. A short break between sessions gives your attention a chance to reset.'],
                            ['Build a routine that sticks', 'Make new habits feel small enough to repeat on a busy day.', 'A sustainable routine does not depend on a perfect schedule. It starts with a small action and a clear cue that reminds you when to begin.', 'Attach a new action to something you already do, like reviewing your plan after your morning coffee. If you miss a day, start again with the next opportunity.'],
                            ['Reflect and adjust', 'Use a simple weekly check-in to decide what is working and what can change.', 'Reflection makes it easier to learn from the week you actually had, rather than the one you planned for. Keep the process brief and judgment-free.', 'Write down one thing that went well, one thing that felt difficult, and one small change to try next week. Revisit your notes and look for patterns over time.'],
                        ],
                    ],
                    [
                        'title' => 'Communicate with confidence',
                        'slug' => 'communicate-with-confidence',
                        'summary' => 'Share ideas clearly, listen actively, and make everyday collaboration a little easier.',
                        'instructor' => 'Morgan James',
                        'level' => 'Beginner',
                        'duration' => 85,
                        'lessons' => [
                            ['Get your message across', 'Structure a short, clear message around what the other person needs to know.', 'A clear message has a purpose and an audience. Starting with the main point helps the other person understand why you are writing or speaking.', 'Add only the context they need, then make the next step explicit. Short paragraphs and specific subject lines make messages easier to scan.'],
                            ['Listen to understand', 'Use active listening to make conversations more productive.', 'Listening is more than waiting for your turn to speak. Give the other person your attention and notice both the words and the concerns behind them.', 'Reflect back the central point in your own words. A thoughtful question can show that you understand and help uncover what matters most.'],
                            ['Give useful feedback', 'Make feedback specific, kind, and focused on something a person can act on.', 'Helpful feedback focuses on an observable situation and its impact, rather than making assumptions about someone’s intentions or character.', 'Be timely and specific. Describe what worked or what could change, then invite the other person to share how they see it.'],
                        ],
                    ],
                ],
            ],
        ];

        foreach ($catalog as $moduleOrder => $moduleData) {
            $courses = $moduleData['courses'];
            unset($moduleData['courses']);
            $module = LearningModule::query()->updateOrCreate(
                ['slug' => $moduleData['slug']],
                [...$moduleData, 'sequence' => $moduleOrder],
            );

            foreach ($courses as $courseOrder => $courseData) {
                $lessons = $courseData['lessons'];
                $durationMinutes = $courseData['duration'];
                unset($courseData['lessons'], $courseData['duration']);
                $course = Course::query()->updateOrCreate(
                    ['slug' => $courseData['slug']],
                    [
                        ...$courseData,
                        'learning_module_id' => $module->id,
                        'duration_minutes' => $durationMinutes,
                        'sequence' => $courseOrder,
                    ],
                );

                foreach ($lessons as $lessonOrder => $lessonData) {
                    [$title, $summary] = array_slice($lessonData, 0, 2);
                    $paragraphs = array_slice($lessonData, 2);

                    Lesson::query()->updateOrCreate(
                        ['course_id' => $course->id, 'slug' => str($title)->slug()->toString()],
                        [
                            'title' => $title,
                            'summary' => $summary,
                            'content' => implode("\n\n", $paragraphs),
                            'duration_minutes' => 8 + ($lessonOrder % 2) * 2,
                            'sequence' => $lessonOrder,
                        ],
                    );
                }
            }
        }
    }
}
