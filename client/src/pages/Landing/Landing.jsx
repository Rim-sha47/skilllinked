import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaUserTie, FaRobot, FaBriefcase, FaArrowRight, FaChartLine } from 'react-icons/fa';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

const Landing = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Floating elements animation
  const floatingVariants = {
    animate: {
      y: [0, -15, 0],
      rotate: [0, 2, -2, 0],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const features = [
    {
      icon: FaUserTie,
      title: "Premium Networking",
      description: "Connect with industry leaders in a high-fidelity, distraction-free environment.",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      icon: FaRobot,
      title: "AI Career Intelligence",
      description: "Get real-time resume scoring and personalized job matches powered by advanced AI.",
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      icon: FaBriefcase,
      title: "Smart Job Portal",
      description: "Discover roles tailored to your unique skill set with 1-click application.",
      color: "text-green-500",
      bg: "bg-green-500/10"
    }
  ];

  return (
    <div className="relative overflow-hidden bg-light-bg dark:bg-dark-bg min-h-screen transition-colors duration-300">
      
      {/* Animated Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 dark:bg-primary/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-accent/20 dark:bg-accent/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-secondary/20 dark:bg-secondary/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none animate-blob animation-delay-4000" />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center z-10">
        <motion.div 
          style={{ y, opacity }}
          className="lg:w-1/2 text-center lg:text-left z-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-white/40 dark:bg-dark-card/40 backdrop-blur-md border border-white/40 dark:border-gray-700/50 shadow-sm mb-6"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            <span className="text-sm font-semibold text-text-primary dark:text-gray-200">Introducing SkillLinked 2.0</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl lg:text-7xl font-extrabold tracking-tight text-text-primary dark:text-white mb-6 leading-tight"
          >
            Elevate Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-accent">
              Professional Future
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg lg:text-xl text-text-secondary dark:text-gray-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
          >
            The next-generation career platform merging intelligent networking, AI-driven job matching, and premium SaaS aesthetics.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          >
            <Link to="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto shadow-glow group">
                Get Started Free 
                <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero Image with Floating UI Elements (Right Side) */}
        <div className="lg:w-1/2 relative mt-16 lg:mt-0 h-[500px] w-full hidden md:flex items-center justify-center">
          
          {/* Central Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 w-full max-w-[450px] aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 border border-white/20 dark:border-gray-800/50"
          >
            <img 
              src="/hero.png" 
              alt="Professional using SkillLinked" 
              className="w-full h-full object-cover"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent pointer-events-none mix-blend-overlay"></div>
          </motion.div>

          {/* Floating Card 1: Resume Score */}
          <motion.div 
            variants={floatingVariants} 
            animate="animate"
            className="absolute top-[5%] right-[5%] w-64 z-20"
          >
            <Card glassHeavy className="p-4 flex items-center space-x-4">
               <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                 <FaRobot size={24} />
               </div>
               <div>
                 <p className="text-xs text-text-secondary dark:text-gray-400 font-medium">Resume Score</p>
                 <p className="text-xl font-bold text-text-primary dark:text-white">92/100</p>
               </div>
            </Card>
          </motion.div>

          {/* Floating Card 2: Profile View */}
          <motion.div 
            variants={floatingVariants} 
            animate="animate"
            style={{ animationDelay: '1s' }}
            className="absolute top-[45%] left-[-5%] w-72 z-30"
          >
            <Card glassHeavy className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-sm font-bold text-text-primary dark:text-white">Sarah Jenkins</p>
                  <p className="text-xs text-text-secondary dark:text-gray-400">Viewed your profile</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">Connect</Button>
            </Card>
          </motion.div>
          
          {/* Floating Card 3: Stats */}
          <motion.div 
            variants={floatingVariants} 
            animate="animate"
            style={{ animationDelay: '2s' }}
            className="absolute bottom-[5%] right-[15%] w-56 z-20"
          >
            <Card glassHeavy className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-text-secondary dark:text-gray-400 font-medium">Profile Views</p>
                <p className="text-lg font-bold text-text-primary dark:text-white">+245%</p>
              </div>
              <FaChartLine className="text-green-500 text-2xl" />
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Logo Carousel */}
      <section className="py-10 border-y border-gray-200/50 dark:border-gray-800/50 bg-white/30 dark:bg-dark-card/30 backdrop-blur-sm z-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-text-secondary dark:text-gray-400 tracking-wider uppercase mb-6">
            Trusted by professionals at top companies
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Using text placeholders since we don't have SVGs */}
            <span className="text-xl font-bold font-serif">TechCorp</span>
            <span className="text-xl font-bold tracking-tighter">GlobalFinance</span>
            <span className="text-xl font-extrabold italic">Innovate.io</span>
            <span className="text-xl font-semibold uppercase">CloudSys</span>
            <span className="text-xl font-black">DataFlow</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-20 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-text-primary dark:text-white mb-4">
            Everything you need to <span className="text-primary">succeed</span>
          </h2>
          <p className="text-lg text-text-secondary dark:text-gray-400 max-w-2xl mx-auto">
            A comprehensive suite of tools designed to help you build your network, showcase your skills, and land your dream job.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full group hover:-translate-y-2 transition-transform duration-300">
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-text-primary dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-text-secondary dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
      {/* Statistics Section */}
      <section className="py-16 bg-primary/5 dark:bg-dark-card/50 border-y border-primary/10 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Active Users', value: '2M+' },
              { label: 'Companies', value: '50k+' },
              { label: 'Jobs Posted', value: '100k+' },
              { label: 'Connections', value: '10M+' }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl font-extrabold text-primary dark:text-accent mb-2">{stat.value}</div>
                <div className="text-sm font-medium text-text-secondary dark:text-gray-400 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-20 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary dark:text-white mb-4">
            Success Stories
          </h2>
          <p className="text-lg text-text-secondary dark:text-gray-400">Hear from professionals who accelerated their careers with us.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Alex Chen", role: "Software Engineer", text: "SkillLinked's AI job matching found me a role I wouldn't have even considered. The platform is incredibly sleek." },
            { name: "Maria Garcia", role: "Product Manager", text: "The premium networking environment here is unmatched. No spam, just real professional growth." },
            { name: "James Wilson", role: "Recruiter", text: "As a recruiter, the candidate quality on SkillLinked is phenomenally higher than legacy platforms." }
          ].map((test, i) => (
            <Card key={i} glassHeavy className="p-6 relative">
              <div className="text-4xl text-primary/20 absolute top-4 right-4">"</div>
              <p className="text-text-secondary dark:text-gray-300 italic mb-6 relative z-10">"{test.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent"></div>
                <div>
                  <h4 className="font-bold text-text-primary dark:text-white text-sm">{test.name}</h4>
                  <p className="text-xs text-text-secondary dark:text-gray-400">{test.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white/30 dark:bg-dark-card/30 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-800/50 z-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-6">
            {[
              { q: "Is SkillLinked free to use?", a: "Yes, the core networking and job application features are completely free forever." },
              { q: "How is it different from LinkedIn?", a: "We focus on a distraction-free, highly curated experience powered by AI to give you relevant matches, not just endless feeds." },
              { q: "Can my company post jobs?", a: "Absolutely. Companies can register specialized accounts to post jobs and search for talent seamlessly." }
            ].map((faq, i) => (
              <Card key={i} className="p-6">
                <h3 className="text-lg font-bold text-text-primary dark:text-white mb-2">{faq.q}</h3>
                <p className="text-text-secondary dark:text-gray-400">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-24 relative z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card glassHeavy className="relative overflow-hidden p-10 md:p-16 text-center border-primary/30">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 z-0"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-text-primary dark:text-white mb-6">
                Ready to transform your career?
              </h2>
              <p className="text-lg text-text-secondary dark:text-gray-300 mb-10 max-w-2xl mx-auto">
                Join thousands of professionals who are already using SkillLinked to build their brand and find amazing opportunities.
              </p>
              <Link to="/auth/signup">
                <Button size="lg" className="shadow-glow px-10">
                  Create Your Free Profile
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-gray-200/50 dark:border-gray-800/50 bg-white/30 dark:bg-dark-bg/80 backdrop-blur-md py-10 z-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-2xl font-bold text-primary dark:text-accent mb-4 md:mb-0">
            SkillLinked
          </div>
          <div className="flex space-x-6 text-sm font-medium text-text-secondary dark:text-gray-400">
            <a href="#" className="hover:text-primary transition-colors">About</a>
            <a href="#" className="hover:text-primary transition-colors">Careers</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
          </div>
          <div className="mt-4 md:mt-0 text-sm text-text-secondary dark:text-gray-500">
            &copy; 2026 SkillLinked. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
