/**
 * GET /api/push-scripture
 * Called by Vercel Cron at 06:00 every day (WAT = UTC+1, so cron fires at 05:00 UTC).
 * Fetches today's scripture from Firestore (same logic as coc-scripture-firebase.js)
 * and sends a Web Push notification to every stored subscription.
 *
 * Required env vars (set in Vercel dashboard → Settings → Environment Variables):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY      (paste the full multi-line key, Vercel stores it safely)
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   VAPID_MAILTO              e.g. mailto:admin@joincoc.com
 *   CRON_SECRET               a random string you invent – keeps the endpoint private
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore }            from 'firebase-admin/firestore';
import { credential }              from 'firebase-admin';
import webpush                     from 'web-push';

// ── Firebase Admin ──
if (!getApps().length) {
    initializeApp({
        credential: credential.cert({
            projectId:   process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    });
}
const db = getFirestore();

// ── VAPID ──
webpush.setVapidDetails(
    process.env.VAPID_MAILTO,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// ── Fallback scriptures (same as coc-scripture-firebase.js) ──
const FALLBACK_SCRIPTURES = [
    { verse: '"Trust in the Lord with all your heart and lean not on your own understanding."', reference: 'Proverbs 3:5' },
    { verse: '"I can do all things through Christ who strengthens me."', reference: 'Philippians 4:13' },
    { verse: '"The Lord is my shepherd; I shall not want."', reference: 'Psalm 23:1' },
    { verse: '"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."', reference: 'Joshua 1:9' },
    { verse: '"And we know that in all things God works for the good of those who love him, who have been called according to his purpose."', reference: 'Romans 8:28' },
    { verse: '"The Lord is my light and my salvation — whom shall I fear?"', reference: 'Psalm 27:1' },
    { verse: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."', reference: 'Jeremiah 29:11' },
    { verse: '"Ask and it will be given to you; seek and you will find; knock and the door will be opened to you."', reference: 'Matthew 7:7' },
    { verse: '"Come to me, all you who are weary and burdened, and I will give you rest."', reference: 'Matthew 11:28' },
    { verse: '"The name of the Lord is a fortified tower; the righteous run to it and are safe."', reference: 'Proverbs 18:10' },
    { verse: '"Delight yourself in the Lord, and he will give you the desires of your heart."', reference: 'Psalm 37:4' },
    { verse: '"No weapon forged against you will prevail."', reference: 'Isaiah 54:17' },
    { verse: '"But those who hope in the Lord will renew their strength. They will soar on wings like eagles."', reference: 'Isaiah 40:31' },
    { verse: '"Cast all your anxiety on him because he cares for you."', reference: '1 Peter 5:7' },
    { verse: '"The Lord is near to all who call on him, to all who call on him in truth."', reference: 'Psalm 145:18' },
    { verse: '"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."', reference: 'John 3:16' },
    { verse: '"If God is for us, who can be against us?"', reference: 'Romans 8:31' },
    { verse: '"The Lord will fight for you; you need only to be still."', reference: 'Exodus 14:14' },
    { verse: '"My grace is sufficient for you, for my power is made perfect in weakness."', reference: '2 Corinthians 12:9' },
    { verse: '"The Lord is my rock, my fortress and my deliverer; my God is my rock, in whom I take refuge."', reference: 'Psalm 18:2' },
    { verse: '"God is our refuge and strength, an ever-present help in trouble."', reference: 'Psalm 46:1' },
    { verse: '"The righteous cry out, and the Lord hears them; he delivers them from all their troubles."', reference: 'Psalm 34:17' },
    { verse: '"Call to me and I will answer you and tell you great and unsearchable things you do not know."', reference: 'Jeremiah 33:3' },
    { verse: '"The Lord is good, a refuge in times of trouble. He cares for those who trust in him."', reference: 'Nahum 1:7' },
    { verse: '"The Lord is my strength and my shield; my heart trusts in him, and he helps me."', reference: 'Psalm 28:7' },
    { verse: '"I will say of the Lord, He is my refuge and my fortress, my God, in whom I trust."', reference: 'Psalm 91:2' },
    { verse: '"Trust in him at all times, you people; pour out your hearts to him, for God is our refuge."', reference: 'Psalm 62:8' },
    { verse: '"Those who trust in the Lord are like Mount Zion, which cannot be shaken but endures forever."', reference: 'Psalm 125:1' },
    { verse: '"Blessed is the man who trusts in the Lord, whose confidence is in him."', reference: 'Jeremiah 17:7' },
    { verse: '"Commit your way to the Lord; trust in him and he will do this."', reference: 'Psalm 37:5' },
    { verse: '"When I am afraid, I put my trust in you."', reference: 'Psalm 56:3' },
    { verse: '"Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid."', reference: 'John 14:27' },
    { verse: '"The Lord gives strength to his people; the Lord blesses his people with peace."', reference: 'Psalm 29:11' },
    { verse: '"Let the peace of Christ rule in your hearts, since as members of one body you were called to peace. And be thankful."', reference: 'Colossians 3:15' },
    { verse: '"Now may the Lord of peace himself give you peace at all times and in every way. The Lord be with all of you."', reference: '2 Thessalonians 3:16' },
    { verse: '"Come to me, all you who are weary and burdened, and I will give you rest."', reference: 'Matthew 11:28' },
    { verse: '"Be still before the Lord and wait patiently for him."', reference: 'Psalm 37:7' },
    { verse: '"The Lord will fight for you; you need only to be still."', reference: 'Exodus 14:14' },
    { verse: '"He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul."', reference: 'Psalm 23:2-3' },
    { verse: '"Return to your rest, my soul, for the Lord has been good to you."', reference: 'Psalm 116:7' },
    { verse: '"The Lord is my shepherd; I shall not want. He makes me lie down in green pastures."', reference: 'Psalm 23:1-2' },
    { verse: '"Be still, and know that I am God."', reference: 'Psalm 46:10' },
    { verse: '"He gives strength to the weary and increases the power of the weak."', reference: 'Isaiah 40:29' },
    { verse: '"The Lord is gracious and compassionate, slow to anger and rich in love."', reference: 'Psalm 145:8' },
    { verse: '"Praise the Lord, my soul, and forget not all his benefits."', reference: 'Psalm 103:2' },
    { verse: '"The Lord is good to all; he has compassion on all he has made."', reference: 'Psalm 145:9' },
    { verse: '"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."', reference: 'Philippians 4:6' },
    { verse: '"Casting all your anxieties on him, because he cares for you."', reference: '1 Peter 5:7' },
    { verse: '"Do not let your hearts be troubled. You believe in God; believe also in me."', reference: 'John 14:1' },
    { verse: '"Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls."', reference: 'Matthew 11:29' },
    { verse: '"For my yoke is easy and my burden is light."', reference: 'Matthew 11:30' },
    { verse: '"If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you."', reference: 'James 1:5' },
    { verse: '"Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."', reference: 'Proverbs 3:5-6' },
    { verse: '"The fear of the Lord is the beginning of wisdom, and knowledge of the Holy One is understanding."', reference: 'Proverbs 9:10' },
    { verse: '"For the Lord gives wisdom; from his mouth come knowledge and understanding."', reference: 'Proverbs 2:6' },
    { verse: '"Be very careful, then, how you live—not as unwise but as wise, making the most of every opportunity."', reference: 'Ephesians 5:15-16' },
    { verse: '"The heart of the discerning acquires knowledge, for the ears of the wise seek it out."', reference: 'Proverbs 18:15' },
    { verse: '"The wise in heart accept commands, but a chattering fool comes to ruin."', reference: 'Proverbs 10:8' },
    { verse: '"The tongue of the wise adorns knowledge, but the mouth of the fool gushes folly."', reference: 'Proverbs 15:2' },
    { verse: '"The prudent give thought to their steps."', reference: 'Proverbs 14:15' },
    { verse: '"The beginning of wisdom is this: Get wisdom. Though it cost all you have, get understanding."', reference: 'Proverbs 4:7' },
    { verse: '"I will guide you along the best pathway for your life. I will advise you and watch over you."', reference: 'Psalm 32:8' },
    { verse: '"Your word is a lamp for my feet, a light on my path."', reference: 'Psalm 119:105' },
    { verse: '"Show me your ways, Lord, teach me your paths."', reference: 'Psalm 25:4' },
    { verse: '"Guide me in your truth and teach me, for you are God my Savior, and my hope is in you all day long."', reference: 'Psalm 25:5' },
    { verse: '"I will instruct you and teach you in the way you should go; I will counsel you with my loving eye on you."', reference: 'Psalm 32:8' },
    { verse: '"Be strong and courageous. Do not be afraid or terrified because of them, for the Lord your God goes with you; he will never leave you nor forsake you."', reference: 'Deuteronomy 31:6' },
    { verse: '"Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."', reference: 'Joshua 1:9' },
    { verse: '"Wait for the Lord; be strong and take heart and wait for the Lord."', reference: 'Psalm 27:14' },
    { verse: '"Do not be afraid, for I am with you; I will bring your children from the east and gather you from the west."', reference: 'Isaiah 43:5' },
    { verse: '"So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand."', reference: 'Isaiah 41:10' },
    { verse: '"God is our refuge and strength, an ever-present help in trouble."', reference: 'Psalm 46:1' },
    { verse: '"The Lord is my light and my salvation—whom shall I fear? The Lord is the stronghold of my life—of whom shall I be afraid?"', reference: 'Psalm 27:1' },
    { verse: '"I sought the Lord, and he answered me; he delivered me from all my fears."', reference: 'Psalm 34:4' },
    { verse: '"When I called, you answered me; you greatly emboldened me."', reference: 'Psalm 138:3' },
    { verse: '"The Lord is my strength and my defense; he has become my salvation."', reference: 'Psalm 118:14' },
    { verse: '"The Lord is my strength and my song; he has given me victory."', reference: 'Psalm 118:14' },
    { verse: '"Be on your guard; stand firm in the faith; be courageous; be strong."', reference: '1 Corinthians 16:13' },
    { verse: '"Finally, be strong in the Lord and in his mighty power."', reference: 'Ephesians 6:10' },
    { verse: '"He gives strength to the weary and increases the power of the weak."', reference: 'Isaiah 40:29' },
    { verse: '"But those who hope in the Lord will renew their strength. They will soar on wings like eagles."', reference: 'Isaiah 40:31' },
    { verse: '"We love because he first loved us."', reference: '1 John 4:19' },
    { verse: '"God is love. Whoever lives in love lives in God, and God in them."', reference: '1 John 4:16' },
    { verse: '"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."', reference: 'John 3:16' },
    { verse: '"But God demonstrates his own love for us in this: While we were still sinners, Christ died for us."', reference: 'Romans 5:8' },
    { verse: '"Greater love has no one than this: to lay down one\'s life for one\'s friends."', reference: 'John 15:13' },
    { verse: '"Love is patient, love is kind. It does not envy, it does not boast, it is not proud."', reference: '1 Corinthians 13:4' },
    { verse: '"It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs."', reference: '1 Corinthians 13:5' },
    { verse: '"Love does not delight in evil but rejoices with the truth."', reference: '1 Corinthians 13:6' },
    { verse: '"It always protects, always trusts, always hopes, always perseveres."', reference: '1 Corinthians 13:7' },
    { verse: '"And now these three remain: faith, hope and love. But the greatest of these is love."', reference: '1 Corinthians 13:13' },
    { verse: '"For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God."', reference: 'Ephesians 2:8' },
    { verse: '"My grace is sufficient for you, for my power is made perfect in weakness."', reference: '2 Corinthians 12:9' },
    { verse: '"The grace of our Lord was poured out on me abundantly, along with the faith and love that are in Christ Jesus."', reference: '1 Timothy 1:14' },
    { verse: '"He gives grace to the humble."', reference: 'James 4:6' },
    { verse: '"But he said to me, "My grace is sufficient for you, for my power is made perfect in weakness.""', reference: '2 Corinthians 12:9' },
    { verse: '"For from his fullness we have all received, grace upon grace."', reference: 'John 1:16' },
    { verse: '"Let us then approach God\'s throne of grace with confidence, so that we may receive mercy and find grace to help us in our time of need."', reference: 'Hebrews 4:16' },
    { verse: '"The law was given through Moses; grace and truth came through Jesus Christ."', reference: 'John 1:17' },
    { verse: '"For sin shall no longer be your master, because you are not under the law, but under grace."', reference: 'Romans 6:14' },
    { verse: '"The grace of the Lord Jesus be with God\'s people. Amen."', reference: 'Revelation 22:21' },
    { verse: '"May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit."', reference: 'Romans 15:13' },
    { verse: '"I pray that the eyes of your heart may be enlightened in order that you may know the hope to which he has called you."', reference: 'Ephesians 1:18' },
    { verse: '"We have this hope as an anchor for the soul, firm and secure."', reference: 'Hebrews 6:19' },
    { verse: '"Be joyful in hope, patient in affliction, faithful in prayer."', reference: 'Romans 12:12' },
    { verse: '"And hope does not put us to shame, because God\'s love has been poured out into our hearts through the Holy Spirit, who has been given to us."', reference: 'Romans 5:5' },
    { verse: '"For everything that was written in the past was written to teach us, so that through the endurance taught in the Scriptures and the encouragement they provide we might have hope."', reference: 'Romans 15:4' },
    { verse: '"Therefore, my dear brothers and sisters, stand firm. Let nothing move you. Always give yourselves fully to the work of the Lord, because you know that your labor in the Lord is not in vain."', reference: '1 Corinthians 15:58' },
    { verse: '"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up."', reference: 'Galatians 6:9' },
    { verse: '"Therefore encourage one another and build each other up, just as in fact you are doing."', reference: '1 Thessalonians 5:11' },
    { verse: '"But you, dear friends, by building yourselves up in your most holy faith and praying in the Holy Spirit, keep yourselves in God\'s love."', reference: 'Jude 1:20-21' },
    { verse: '"Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."', reference: 'Joshua 1:9' },
    { verse: '"The Lord is my light and my salvation—whom shall I fear? The Lord is the stronghold of my life—of whom shall I be afraid?"', reference: 'Psalm 27:1' },
    { verse: '"God is our refuge and strength, an ever-present help in trouble. Therefore we will not fear, though the earth give way and the mountains fall into the heart of the sea."', reference: 'Psalm 46:1-2' },
    { verse: '"But those who hope in the Lord will renew their strength. They will soar on wings like eagles."', reference: 'Isaiah 40:31' },
    { verse: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."', reference: 'Jeremiah 29:11' },
    { verse: '"And we know that in all things God works for the good of those who love him, who have been called according to his purpose."', reference: 'Romans 8:28' },
    { verse: '"The Lord is near to all who call on him, to all who call on him in truth."', reference: 'Psalm 145:18' },
    { verse: '"He heals the brokenhearted and binds up their wounds."', reference: 'Psalm 147:3' },
    { verse: '"The Lord is gracious and compassionate, slow to anger and rich in love."', reference: 'Psalm 145:8' },
    { verse: '"The Lord is good to all; he has compassion on all he has made."', reference: 'Psalm 145:9' },
    { verse: '"He himself bore our sins in his body on the cross, so that we might die to sins and live for righteousness; by his wounds you have been healed."', reference: '1 Peter 2:24' },
    { verse: '"I am the Lord, who heals you."', reference: 'Exodus 15:26' },
    { verse: '"Heal the sick, raise the dead, cleanse those who have leprosy, drive out demons."', reference: 'Matthew 10:8' },
    { verse: '"And these signs will accompany those who believe: In my name they will drive out demons... they will place their hands on sick people, and they will get well."', reference: 'Mark 16:17-18' },
    { verse: '"He said to her, "Daughter, your faith has healed you. Go in peace and be freed from your suffering.""', reference: 'Mark 5:34' },
    { verse: '"Jesus went throughout Galilee, teaching in their synagogues, proclaiming the good news of the kingdom, and healing every disease and sickness among the people."', reference: 'Matthew 4:23' },
    { verse: '"He took up our pain and bore our suffering... and by his wounds we are healed."', reference: 'Isaiah 53:4-5' },
    { verse: '"I will give you health and heal your wounds, declares the Lord."', reference: 'Jeremiah 30:17' },
    { verse: '"He sent out his word and healed them; he rescued them from the grave."', reference: 'Psalm 107:20' },
    { verse: '"Praise the Lord, my soul, and forget not all his benefits—who forgives all your sins and heals all your diseases."', reference: 'Psalm 103:2-3' },
    { verse: '"The Lord will keep you free from every disease."', reference: 'Deuteronomy 7:15' },
    { verse: '"He gives power to the weak and strength to the powerless."', reference: 'Isaiah 40:29' },
    { verse: '"He will call on me, and I will answer him; I will be with him in trouble, I will deliver him and honor him."', reference: 'Psalm 91:15' },
    { verse: '"The righteous cry out, and the Lord hears them; he delivers them from all their troubles."', reference: 'Psalm 34:17' },
    { verse: '"He brought them out of darkness, the utter darkness, and broke away their chains."', reference: 'Psalm 107:14' },
    { verse: '"But he was pierced for our transgressions, he was crushed for our iniquities; the punishment that brought us peace was on him, and by his wounds we are healed."', reference: 'Isaiah 53:5' },
    { verse: '"The Spirit of the Lord is on me, because he has anointed me to proclaim good news to the poor. He has sent me to proclaim freedom for the prisoners and recovery of sight for the blind, to set the oppressed free."', reference: 'Luke 4:18' },
    { verse: '"Therefore confess your sins to each other and pray for each other so that you may be healed. The prayer of a righteous person is powerful and effective."', reference: 'James 5:16' },
    { verse: '"Is anyone among you sick? Let them call the elders of the church to pray over them and anoint them with oil in the name of the Lord. And the prayer offered in faith will make the sick person well."', reference: 'James 5:14-15' },
    { verse: '"Jesus Christ is the same yesterday and today and forever."', reference: 'Hebrews 13:8' },
    { verse: '"Rejoice always, pray continually, give thanks in all circumstances; for this is God\'s will for you in Christ Jesus."', reference: '1 Thessalonians 5:16-18' },
    { verse: '"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."', reference: 'Philippians 4:6' },
    { verse: '"And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus."', reference: 'Philippians 4:7' },
    { verse: '"Pray without ceasing."', reference: '1 Thessalonians 5:17' },
    { verse: '"The Lord is near to all who call on him, to all who call on him in truth."', reference: 'Psalm 145:18' },
    { verse: '"Then you will call on me and come and pray to me, and I will listen to you."', reference: 'Jeremiah 29:12' },
    { verse: '"He will call on me, and I will answer him; I will be with him in trouble, I will deliver him and honor him."', reference: 'Psalm 91:15' },
    { verse: '"Call to me and I will answer you and tell you great and unsearchable things you do not know."', reference: 'Jeremiah 33:3' },
    { verse: '"This is the confidence we have in approaching God: that if we ask anything according to his will, he hears us."', reference: '1 John 5:14' },
    { verse: '"And if we know that he hears us—whatever we ask—we know that we have what we asked of him."', reference: '1 John 5:15' },
    { verse: '"Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name."', reference: 'Psalm 100:4' },
    { verse: '"Come, let us sing for joy to the Lord; let us shout aloud to the Rock of our salvation."', reference: 'Psalm 95:1' },
    { verse: '"Let everything that has breath praise the Lord. Praise the Lord."', reference: 'Psalm 150:6' },
    { verse: '"Praise the Lord, my soul; all my inmost being, praise his holy name."', reference: 'Psalm 103:1' },
    { verse: '"Great is the Lord and most worthy of praise; his greatness no one can fathom."', reference: 'Psalm 145:3' },
    { verse: '"I will exalt you, my God the King; I will praise your name for ever and ever."', reference: 'Psalm 145:1' },
    { verse: '"One generation shall commend your works to another, and shall declare your mighty acts."', reference: 'Psalm 145:4' },
    { verse: '"They will speak of the glorious splendor of your majesty, and I will meditate on your wonderful works."', reference: 'Psalm 145:5' },
    { verse: '"The Lord is faithful to all his promises and loving toward all he has made."', reference: 'Psalm 145:13' },
    { verse: '"My mouth will speak in praise of the Lord. Let every creature praise his holy name for ever and ever."', reference: 'Psalm 145:21' },
    { verse: '"Be joyful in hope, patient in affliction, faithful in prayer."', reference: 'Romans 12:12' },
    { verse: '"But those who hope in the Lord will renew their strength. They will soar on wings like eagles."', reference: 'Isaiah 40:31' },
    { verse: '"Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up."', reference: 'Galatians 6:9' },
    { verse: '"Therefore, my dear brothers and sisters, stand firm. Let nothing move you. Always give yourselves fully to the work of the Lord, because you know that your labor in the Lord is not in vain."', reference: '1 Corinthians 15:58' },
    { verse: '"Perseverance must finish its work so that you may be mature and complete, not lacking anything."', reference: 'James 1:4' },
    { verse: '"Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance."', reference: 'James 1:2-3' },
    { verse: '"Blessed is the one who perseveres under trial because, having stood the test, that person will receive the crown of life that the Lord has promised to those who love him."', reference: 'James 1:12' },
    { verse: '"Be strong and take heart, all you who hope in the Lord."', reference: 'Psalm 31:24' },
    { verse: '"Wait for the Lord; be strong and take heart and wait for the Lord."', reference: 'Psalm 27:14' },
    { verse: '"The Lord is good to those whose hope is in him, to the one who seeks him."', reference: 'Lamentations 3:25' },
    { verse: '"It is good to wait quietly for the salvation of the Lord."', reference: 'Lamentations 3:26' },
    { verse: '"The Lord is my portion," says my soul, "therefore I will hope in him."', reference: 'Lamentations 3:24' },
    { verse: '"I wait for the Lord, my whole being waits, and in his word I put my hope."', reference: 'Psalm 130:5' },
    { verse: '"I remember, and my soul is downcast within me. Yet this I call to mind and therefore I have hope: Because of the Lord\'s great love we are not consumed, for his compassions never fail."', reference: 'Lamentations 3:20-22' },
    { verse: '"They are new every morning; great is your faithfulness."', reference: 'Lamentations 3:23' },
    { verse: '"I say to myself, "The Lord is my portion; therefore I will wait for him.""', reference: 'Lamentations 3:24' },
    { verse: '"But I will hope continually and will praise you yet more and more."', reference: 'Psalm 71:14' },
    { verse: '"My soul waits for the Lord more than watchmen wait for the morning."', reference: 'Psalm 130:6' },
    { verse: '"But they who wait for the Lord shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint."', reference: 'Isaiah 40:31' },
    { verse: '"The Lord will fight for you; you need only to be still."', reference: 'Exodus 14:14' },
    { verse: '"If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness."', reference: '1 John 1:9' },
    { verse: '"As far as the east is from the west, so far has he removed our transgressions from us."', reference: 'Psalm 103:12' },
    { verse: '"In him we have redemption through his blood, the forgiveness of sins, in accordance with the riches of God\'s grace."', reference: 'Ephesians 1:7' },
    { verse: '"But God demonstrates his own love for us in this: While we were still sinners, Christ died for us."', reference: 'Romans 5:8' },
    { verse: '"Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!"', reference: '2 Corinthians 5:17' },
    { verse: '"He saved us, not because of righteous things we had done, but because of his mercy."', reference: 'Titus 3:5' },
    { verse: '"God made him who had no sin to be sin for us, so that in him we might become the righteousness of God."', reference: '2 Corinthians 5:21' },
    { verse: '"There is therefore now no condemnation for those who are in Christ Jesus."', reference: 'Romans 8:1' },
    { verse: '"But because of his great love for us, God, who is rich in mercy, made us alive with Christ even when we were dead in transgressions—it is by grace you have been saved."', reference: 'Ephesians 2:4-5' },
    { verse: '"For he has rescued us from the dominion of darkness and brought us into the kingdom of the Son he loves, in whom we have redemption, the forgiveness of sins."', reference: 'Colossians 1:13-14' },
    { verse: '"Then I acknowledged my sin to you and did not cover up my iniquity. I said, "I will confess my transgressions to the Lord." And you forgave the guilt of my sin."', reference: 'Psalm 32:5' },
    { verse: '"The Lord is compassionate and gracious, slow to anger, abounding in love."', reference: 'Psalm 103:8' },
    { verse: '"He will not always accuse, nor will he harbor his anger forever; he does not treat us as our sins deserve or repay us according to our iniquities."', reference: 'Psalm 103:9-10' },
    { verse: '"For as high as the heavens are above the earth, so great is his love for those who fear him."', reference: 'Psalm 103:11' },
    { verse: '"He forgives all your sins and heals all your diseases."', reference: 'Psalm 103:3' },
    { verse: '"Come now, let us settle the matter," says the Lord. "Though your sins are like scarlet, they shall be as white as snow."', reference: 'Isaiah 1:18' },
    { verse: '"I, even I, am he who blots out your transgressions, for my own sake, and remembers your sins no more."', reference: 'Isaiah 43:25' },
    { verse: '"For I will forgive their wickedness and will remember their sins no more."', reference: 'Hebrews 8:12' },
    { verse: '"But if we walk in the light, as he is in the light, we have fellowship with one another, and the blood of Jesus, his Son, purifies us from all sin."', reference: '1 John 1:7' },
    { verse: '"My dear children, I write this to you so that you will not sin. But if anybody does sin, we have an advocate with the Father—Jesus Christ, the Righteous One."', reference: '1 John 2:1' },
    { verse: '"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."', reference: 'John 3:16' },
    { verse: '"Now this is eternal life: that they know you, the only true God, and Jesus Christ, whom you have sent."', reference: 'John 17:3' },
    { verse: '"And this is the testimony: God has given us eternal life, and this life is in his Son."', reference: '1 John 5:11' },
    { verse: '"Whoever has the Son has life; whoever does not have the Son of God does not have life."', reference: '1 John 5:12' },
    { verse: '"I give them eternal life, and they shall never perish; no one will snatch them out of my hand."', reference: 'John 10:28' },
    { verse: '"For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord."', reference: 'Romans 6:23' },
    { verse: '"In my Father\'s house are many rooms; if it were not so, I would have told you. I am going there to prepare a place for you."', reference: 'John 14:2' },
    { verse: '"And if I go and prepare a place for you, I will come back and take you to be with me that you also may be where I am."', reference: 'John 14:3' },
    { verse: '"For the Lord himself will come down from heaven, with a loud command, with the voice of the archangel and with the trumpet call of God, and the dead in Christ will rise first."', reference: '1 Thessalonians 4:16' },
    { verse: '"After that, we who are still alive and are left will be caught up together with them in the clouds to meet the Lord in the air. And so we will be with the Lord forever."', reference: '1 Thessalonians 4:17' },
    { verse: '"And God will wipe away every tear from their eyes; there shall be no more death, nor sorrow, nor crying. There shall be no more pain, for the former things have passed away."', reference: 'Revelation 21:4' },
    { verse: '"He who was seated on the throne said, "I am making everything new!""', reference: 'Revelation 21:5' },
    { verse: '"Blessed are those who wash their robes, that they may have the right to the tree of life and may go through the gates into the city."', reference: 'Revelation 22:14' },
    { verse: '"The Spirit and the bride say, "Come!" And let the one who hears say, "Come!" Let the one who is thirsty come; and let the one who wishes take the free gift of the water of life."', reference: 'Revelation 22:17' },
    { verse: '"He who testifies to these things says, "Yes, I am coming soon." Amen. Come, Lord Jesus."', reference: 'Revelation 22:20' },
    { verse: '"The grace of the Lord Jesus be with God\'s people. Amen."', reference: 'Revelation 22:21' },
    { verse: '"Now to him who is able to keep you from stumbling and to present you before his glorious presence without fault and with great joy."', reference: 'Jude 1:24' },
    { verse: '"To the only God our Savior be glory, majesty, power and authority, through Jesus Christ our Lord, before all ages, now and forevermore! Amen."', reference: 'Jude 1:25' },
    { verse: '"For we must all appear before the judgment seat of Christ, so that each of us may receive what is due us for the things done while in the body, whether good or bad."', reference: '2 Corinthians 5:10' },
    { verse: '"Since, then, you have been raised with Christ, set your hearts on things above, where Christ is, seated at the right hand of God."', reference: 'Colossians 3:1' },
    { verse: '"But thanks be to God, who gives us the victory through our Lord Jesus Christ."', reference: '1 Corinthians 15:57' },
    { verse: '"For everyone born of God overcomes the world. This is the victory that has overcome the world, even our faith."', reference: '1 John 5:4' },
    { verse: '"Who is it that overcomes the world? Only the one who believes that Jesus is the Son of God."', reference: '1 John 5:5' },
    { verse: '"No, in all these things we are more than conquerors through him who loved us."', reference: 'Romans 8:37' },
    { verse: '"For the Lord your God is the one who goes with you to fight for you against your enemies to give you victory."', reference: 'Deuteronomy 20:4' },
    { verse: '"The Lord will cause your enemies who rise against you to be defeated before you. They will come out against you one way and flee before you seven ways."', reference: 'Deuteronomy 28:7' },
    { verse: '"Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand."', reference: 'Isaiah 41:10' },
    { verse: '"In all these things we are more than conquerors through him who loved us."', reference: 'Romans 8:37' },
    { verse: '"For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord."', reference: 'Romans 8:38-39' },
    { verse: '"The sting of death is sin, and the power of sin is the law. But thanks be to God! He gives us the victory through our Lord Jesus Christ."', reference: '1 Corinthians 15:56-57' },
    { verse: '"Now thanks be to God, who always leads us in triumph in Christ."', reference: '2 Corinthians 2:14' },
    { verse: '"He who dwells in the shelter of the Most High will rest in the shadow of the Almighty."', reference: 'Psalm 91:1' },
    { verse: '"A thousand may fall at your side, ten thousand at your right hand, but it will not come near you."', reference: 'Psalm 91:7' },
    { verse: '"For he will command his angels concerning you to guard you in all your ways."', reference: 'Psalm 91:11' },
    { verse: '"They will lift you up in their hands, so that you will not strike your foot against a stone."', reference: 'Psalm 91:12' },
    { verse: '"Because he loves me," says the Lord, "I will rescue him; I will protect him, for he acknowledges my name."', reference: 'Psalm 91:14' },
    { verse: '"He will call on me, and I will answer him; I will be with him in trouble, I will deliver him and honor him."', reference: 'Psalm 91:15' },
    { verse: '"With long life I will satisfy him and show him my salvation."', reference: 'Psalm 91:16' },
    { verse: '"My flesh and my heart may fail, but God is the strength of my heart and my portion forever."', reference: 'Psalm 73:26' },
    { verse: '"But as for me, it is good to be near God. I have made the Sovereign Lord my refuge; I will tell of all your deeds."', reference: 'Psalm 73:28' },
    { verse: '"The Lord is my strength and my song; he has become my salvation."', reference: 'Psalm 118:14' },
    { verse: '"Give thanks to the Lord, for he is good; his love endures forever."', reference: 'Psalm 118:29' },
    { verse: '"The Lord has done it this very day; let us rejoice today and be glad."', reference: 'Psalm 118:24' },
    { verse: '"Praise the Lord, all you nations; extol him, all you peoples. For great is his love toward us, and the faithfulness of the Lord endures forever. Praise the Lord."', reference: 'Psalm 117' },
    { verse: '"Let everything that has breath praise the Lord. Praise the Lord!"', reference: 'Psalm 150:6' },
    { verse: '"Praise the Lord. Praise God in his sanctuary; praise him in his mighty heavens."', reference: 'Psalm 150:1' },
    { verse: '"Praise him for his acts of power; praise him for his surpassing greatness."', reference: 'Psalm 150:2' },
    { verse: '"Praise him with the sounding of the trumpet, praise him with the harp and lyre."', reference: 'Psalm 150:3' },
    { verse: '"Let everything that has breath praise the Lord. Praise the Lord!"', reference: 'Psalm 150:6' },
    { verse: '"Bless the Lord, O my soul, and all that is within me, bless his holy name!"', reference: 'Psalm 103:1' }
];

async function getTodaysScripture() {
    try {
        // Try Firestore first (same approach as coc-scripture-firebase.js)
        const snapshot = await db.collection('scriptures').orderBy('order').get();
        let verses = snapshot.docs.map(d => d.data());
        if (verses.length === 0) verses = FALLBACK_SCRIPTURES;

        const now          = new Date();
        const startOfYear  = new Date(now.getFullYear(), 0, 0);
        const dayOfYear    = Math.floor((now - startOfYear) / 86_400_000);
        return verses[dayOfYear % verses.length];
    } catch (err) {
        console.warn('Firestore unavailable, using fallback:', err.message);
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86_400_000);
        return FALLBACK_SCRIPTURES[dayOfYear % FALLBACK_SCRIPTURES.length];
    }
}

export default async function handler(req, res) {
    // Vercel Cron automatically sends your CRON_SECRET as an
    // "Authorization: Bearer <CRON_SECRET>" header — it does NOT send a
    // custom "x-cron-secret" header or a "?secret=" query param. The old
    // check here looked for headers Vercel never sends, so it was always
    // undefined and every real cron invocation was rejected with 401,
    // silently, every day. That's why no push notifications ever went out
    // even though the cron itself was firing on schedule.
    //
    // We check the standard Authorization header (what Vercel actually
    // sends) and keep the old header/query checks only as a fallback for
    // manual/local testing (e.g. curl -H "x-cron-secret: ..." or ?secret=).
    const expected = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization || '';
    const legacySecret = req.headers['x-cron-secret'] ?? req.query.secret;

    const authorized =
        !!expected &&
        (authHeader === `Bearer ${expected}` || legacySecret === expected);

    if (!authorized) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const scripture = await getTodaysScripture();

        const payload = JSON.stringify({
            title: '📖 Scripture of the Day',
            body:  `${scripture.verse} — ${scripture.reference}`,
            icon:  '/media/logo1.png',
            badge: '/media/logo1.png',
            tag:   'daily-scripture',
            url:   '/index.html#scripture'
        });

        // Fetch all stored subscriptions
        const snapshot = await db.collection('push_subscriptions').get();
        if (snapshot.empty) {
            return res.status(200).json({ sent: 0, message: 'No subscribers yet' });
        }

        const results = await Promise.allSettled(
            snapshot.docs.map(async docSnap => {
                const { subscription } = docSnap.data();
                try {
                    await webpush.sendNotification(subscription, payload);
                    return { id: docSnap.id, status: 'sent' };
                } catch (err) {
                    // 410 Gone = subscription expired / user unsubscribed → delete it
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await docSnap.ref.delete();
                        return { id: docSnap.id, status: 'removed' };
                    }
                    throw err;
                }
            })
        );

        const sent    = results.filter(r => r.status === 'fulfilled' && r.value?.status === 'sent').length;
        const removed = results.filter(r => r.status === 'fulfilled' && r.value?.status === 'removed').length;
        const failed  = results.filter(r => r.status === 'rejected').length;

        console.log(`Push scripture: sent=${sent} removed=${removed} failed=${failed}`);
        return res.status(200).json({ sent, removed, failed });

    } catch (err) {
        console.error('push-scripture error:', err);
        return res.status(500).json({ error: err.message });
    }
}