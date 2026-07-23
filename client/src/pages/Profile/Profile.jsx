import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { FaMapMarkerAlt, FaLink, FaEdit, FaPlus, FaGraduationCap, FaBriefcase, FaCertificate, FaCode, FaExternalLinkAlt, FaTrash, FaCheckCircle } from 'react-icons/fa';
import { 
  fetchMyProfile, 
  updateBasicInfo, 
  addExperience, removeExperience,
  addEducation, removeEducation,
  addSkill, removeSkill,
  addCertification, removeCertification,
  updateAvatar 
} from '../../redux/slices/profileSlice';
import { updateUser } from '../../redux/slices/authSlice';

import BasicInfoForm from '../../components/profile/BasicInfoForm';
import ExperienceForm from '../../components/profile/ExperienceForm';
import EducationForm from '../../components/profile/EducationForm';
import SkillForm from '../../components/profile/SkillForm';
import CertificationForm from '../../components/profile/CertificationForm';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { data: profile, isLoading } = useSelector(state => state.profile);

  // Modal states
  const [modals, setModals] = useState({
    basicInfo: false,
    experience: false,
    education: false,
    skill: false,
    certification: false,
    profilePic: false
  });
  
  // For editing existing entries
  const [editItem, setEditItem] = useState(null);

  const openModal = (type, item = null) => {
    // For date inputs, we need to convert ISO strings to YYYY-MM-DD
    if (item && (item.from || item.to || item.issueDate)) {
      const formattedItem = { ...item };
      if (formattedItem.from) formattedItem.from = formattedItem.from.split('T')[0];
      if (formattedItem.to) formattedItem.to = formattedItem.to.split('T')[0];
      if (formattedItem.issueDate) formattedItem.issueDate = formattedItem.issueDate.split('T')[0];
      if (formattedItem.expirationDate) formattedItem.expirationDate = formattedItem.expirationDate.split('T')[0];
      setEditItem(formattedItem);
    } else {
      setEditItem(item);
    }
    setModals(prev => ({ ...prev, [type]: true }));
  };

  const closeModal = (type) => {
    setEditItem(null);
    setModals(prev => ({ ...prev, [type]: false }));
  };

  useEffect(() => {
    dispatch(fetchMyProfile());
  }, [dispatch]);

  // Submit Handlers
  const handleBasicInfoSubmit = async (data) => {
    try {
      await dispatch(updateBasicInfo(data)).unwrap();
      closeModal('basicInfo');
    } catch (err) { console.error(err); }
  };

  const handleExperienceSubmit = async (data) => {
    try {
      await dispatch(addExperience(data)).unwrap();
      closeModal('experience');
    } catch (err) { console.error(err); }
  };

  const handleEducationSubmit = async (data) => {
    try {
      await dispatch(addEducation(data)).unwrap();
      closeModal('education');
    } catch (err) { console.error(err); }
  };

  const handleSkillSubmit = async (data) => {
    try {
      await dispatch(addSkill(data.name)).unwrap();
      closeModal('skill');
    } catch (err) { console.error(err); }
  };

  const handleCertificationSubmit = async (data) => {
    try {
      await dispatch(addCertification(data)).unwrap();
      closeModal('certification');
    } catch (err) { console.error(err); }
  };

  const handleProfilePicSubmit = async (formData) => {
    try {
      const res = await dispatch(updateAvatar(formData)).unwrap();
      if (res && res.profilePicture) {
        dispatch(updateUser({ profilePicture: res.profilePicture, avatar: res.profilePicture }));
      }
      closeModal('profilePic');
    } catch (err) { console.error(err); }
  };

  if (isLoading && !profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Fallback for user initials
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* MODALS */}
      <Modal isOpen={modals.basicInfo} onClose={() => closeModal('basicInfo')}>
        <BasicInfoForm defaultValues={profile} onSubmit={handleBasicInfoSubmit} isSubmitting={isLoading} />
      </Modal>

      <Modal isOpen={modals.experience} onClose={() => closeModal('experience')}>
        <ExperienceForm defaultValues={editItem} onSubmit={handleExperienceSubmit} isSubmitting={isLoading} />
      </Modal>

      <Modal isOpen={modals.education} onClose={() => closeModal('education')}>
        <EducationForm defaultValues={editItem} onSubmit={handleEducationSubmit} isSubmitting={isLoading} />
      </Modal>

      <Modal isOpen={modals.skill} onClose={() => closeModal('skill')}>
        <SkillForm onSubmit={handleSkillSubmit} isSubmitting={isLoading} />
      </Modal>

      <Modal isOpen={modals.certification} onClose={() => closeModal('certification')}>
        <CertificationForm defaultValues={editItem} onSubmit={handleCertificationSubmit} isSubmitting={isLoading} />
      </Modal>

      <Modal isOpen={modals.profilePic} onClose={() => closeModal('profilePic')}>
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-white">Update Profile Picture</h2>
        <ProfilePicForm onSubmit={handleProfilePicSubmit} isSubmitting={isLoading} />
      </Modal>


      {/* Instagram-Style Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col md:flex-row items-start md:items-center py-8 px-4 md:px-12 border-b border-gray-200 dark:border-gray-800">
          
          {/* Avatar (Left) */}
          <div className="flex-shrink-0 mr-8 md:mr-16 mb-6 md:mb-0 relative group cursor-pointer" onClick={() => openModal('profilePic')}>
            <div className="w-24 h-24 md:w-36 md:h-36 rounded-full border border-gray-300 dark:border-gray-700 p-1">
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-4xl font-bold text-gray-500">
                {user?.profilePicture || user?.avatar ? <img src={user.profilePicture || user.avatar} alt="Profile" className="w-full h-full object-cover" /> : initials}
              </div>
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity m-1">
               <FaEdit className="text-white text-2xl" />
            </div>
          </div>
          
          {/* Info and Stats (Right) */}
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-5">
              <h1 className="text-xl md:text-2xl font-semibold text-text-primary dark:text-white">
                {user?.username || user?.name || 'username'}
              </h1>
              <div className="flex gap-2">
                <Button variant="outline" className="font-semibold px-4 py-1.5 h-auto text-sm rounded-lg" onClick={() => openModal('basicInfo')}>Edit Profile</Button>
                <Button className="font-semibold px-4 py-1.5 h-auto text-sm rounded-lg">Follow</Button>
                <Button variant="outline" className="font-semibold px-4 py-1.5 h-auto text-sm rounded-lg">Contact</Button>
              </div>
            </div>
            
            <div className="flex gap-6 mb-5 text-sm md:text-base">
              <div className="cursor-pointer group"><strong className="text-text-primary dark:text-white">12</strong> <span className="text-text-secondary dark:text-gray-400">posts</span></div>
              <div className="cursor-pointer group"><strong className="text-text-primary dark:text-white">{user?.followers?.length || 0}</strong> <span className="text-text-secondary dark:text-gray-400">followers</span></div>
              <div className="cursor-pointer group"><strong className="text-text-primary dark:text-white">{user?.following?.length || 0}</strong> <span className="text-text-secondary dark:text-gray-400">following</span></div>
            </div>
            
            <div className="text-sm">
              <p className="font-bold text-text-primary dark:text-white">{user?.name}</p>
              <p className="text-text-secondary dark:text-gray-400 mt-0.5">{profile?.headline}</p>
              <p className="text-text-primary dark:text-white mt-1 whitespace-pre-line">{profile?.bio || 'Add a bio to your profile.'}</p>
              {profile?.website && (
                <a href={profile.website} target="_blank" rel="noreferrer" className="text-blue-900 dark:text-blue-300 font-bold flex items-center mt-1 hover:underline">
                  <FaLink className="mr-1.5" size={12}/> {profile.website}
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Instagram-Style Tabs */}
      <div className="flex justify-center border-b border-gray-200 dark:border-gray-800">
        <div className="flex gap-12 text-xs font-bold tracking-widest uppercase text-gray-500">
          <button className="flex items-center gap-2 py-4 border-t-2 border-primary text-text-primary dark:text-white"><FaCode size={14}/> POSTS</button>
          <button className="flex items-center gap-2 py-4 border-t-2 border-transparent hover:text-text-primary dark:hover:text-white"><FaBriefcase size={14}/> EXPERIENCE</button>
          <button className="flex items-center gap-2 py-4 border-t-2 border-transparent hover:text-text-primary dark:hover:text-white"><FaGraduationCap size={14}/> EDUCATION</button>
        </div>
      </div>
      
      {/* Posts Grid (Mocked for Instagram look) */}
      <div className="grid grid-cols-3 gap-1 md:gap-4 mt-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-800 relative group cursor-pointer overflow-hidden rounded-md">
            <img src={`https://picsum.photos/seed/${i + user?._id}/500/500`} alt="Post" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-4">
              <span className="flex items-center"><FaCheckCircle className="mr-1"/> 124</span>
              <span className="flex items-center"><FaPlus className="mr-1"/> 12</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Left Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* About */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="hover:border-primary/20 transition-colors border-2 border-transparent">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-2xl font-bold text-text-primary dark:text-white">About</h2>
                <button onClick={() => openModal('basicInfo')} className="text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"><FaEdit /></button>
              </div>
              <p className="text-base text-text-secondary dark:text-gray-300 whitespace-pre-line leading-relaxed font-medium">
                {profile?.bio || 'Write something about yourself...'}
              </p>
            </Card>
          </motion.div>

          {/* Experience Timeline */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="hover:border-primary/20 transition-colors border-2 border-transparent">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-text-primary dark:text-white">Experience</h2>
                <div className="flex space-x-2">
                  <button onClick={() => openModal('experience')} className="text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"><FaPlus /></button>
                </div>
              </div>
              
              <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-6 space-y-10 pb-4">
                {profile?.experience && profile.experience.length > 0 ? (
                  profile.experience.map((exp, index) => (
                    <div key={exp._id || index} className="relative group">
                      <div className="absolute -left-10 mt-1 w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-primary rounded-full shadow-sm ring-4 ring-white dark:ring-dark-card z-10">
                        <FaBriefcase size={14} />
                      </div>
                      <div className="pl-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold text-text-primary dark:text-white">{exp.title}</h3>
                            <p className="text-base font-semibold text-text-secondary dark:text-gray-300 mt-1">{exp.company} {exp.location ? `• ${exp.location}` : ''}</p>
                            <p className="text-sm font-medium text-gray-500 mt-1.5">
                              {new Date(exp.from).toLocaleDateString()} - {exp.current ? 'Present' : new Date(exp.to).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal('experience', exp)} className="text-gray-400 hover:text-primary p-2 rounded-full"><FaEdit /></button>
                            <button onClick={() => dispatch(removeExperience(exp._id))} className="text-gray-400 hover:text-red-500 p-2 rounded-full"><FaTrash /></button>
                          </div>
                        </div>
                        <p className="text-sm text-text-secondary dark:text-gray-400 mt-4 leading-relaxed font-medium">
                          {exp.description}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 pl-6">No experience added yet.</p>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* Skills */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="hover:border-primary/20 transition-colors border-2 border-transparent">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-text-primary dark:text-white">Top Skills</h2>
                <div className="flex space-x-2">
                  <button onClick={() => openModal('skill')} className="text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"><FaPlus /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <span key={index} className="group flex items-center bg-gray-100 dark:bg-dark-bg text-text-primary dark:text-gray-200 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md hover:border-primary/50 transition-all">
                      {skill}
                      <button onClick={() => dispatch(removeSkill(skill))} className="ml-2 text-gray-400 hover:text-red-500 hidden group-hover:block"><FaTrash size={12} /></button>
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No skills added.</p>
                )}
              </div>
            </Card>
          </motion.div>
          
          {/* Education */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="hover:border-primary/20 transition-colors border-2 border-transparent">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-text-primary dark:text-white">Education</h2>
                <button onClick={() => openModal('education')} className="text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"><FaPlus /></button>
              </div>
              <div className="space-y-4">
                {profile?.education && profile.education.length > 0 ? (
                  profile.education.map((edu, index) => (
                    <div key={edu._id || index} className="flex space-x-4 items-start group relative">
                      <div className="p-3 bg-gray-100 dark:bg-dark-bg rounded-xl text-gray-600 dark:text-gray-400 shadow-sm">
                        <FaGraduationCap size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="text-base font-bold text-text-primary dark:text-white">{edu.school}</h3>
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal('education', edu)} className="text-gray-400 hover:text-primary px-1"><FaEdit size={12}/></button>
                            <button onClick={() => dispatch(removeEducation(edu._id))} className="text-gray-400 hover:text-red-500 px-1"><FaTrash size={12}/></button>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-text-secondary dark:text-gray-400 mt-1">{edu.degree} in {edu.fieldOfStudy}</p>
                        <p className="text-xs font-medium text-gray-500 mt-1">
                           {new Date(edu.from).getFullYear()} - {edu.current ? 'Present' : new Date(edu.to).getFullYear()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No education added.</p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Certifications */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="hover:border-primary/20 transition-colors border-2 border-transparent">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-text-primary dark:text-white">Licenses & Certifications</h2>
                <button onClick={() => openModal('certification')} className="text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"><FaPlus /></button>
              </div>
              <div className="space-y-4">
                {profile?.certifications && profile.certifications.length > 0 ? (
                  profile.certifications.map((cert, index) => (
                    <div key={cert._id || index} className="flex space-x-4 items-start group relative">
                      <div className="p-3 bg-accent/10 dark:bg-accent/20 rounded-xl text-accent shadow-sm">
                        <FaCertificate size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="text-base font-bold text-text-primary dark:text-white">{cert.name}</h3>
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal('certification', cert)} className="text-gray-400 hover:text-primary px-1"><FaEdit size={12}/></button>
                            <button onClick={() => dispatch(removeCertification(cert._id))} className="text-gray-400 hover:text-red-500 px-1"><FaTrash size={12}/></button>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-text-secondary dark:text-gray-400 mt-1">{cert.issuingOrganization}</p>
                        <p className="text-xs font-medium text-gray-500 mt-1 flex items-center">
                          Issued {new Date(cert.issueDate).toLocaleDateString()} {cert.expirationDate ? ` • Expires ${new Date(cert.expirationDate).toLocaleDateString()}` : ' • No Expiration'}
                        </p>
                        {cert.credentialUrl && (
                          <Button variant="outline" size="sm" className="mt-3 text-xs rounded-lg py-1.5 px-3" onClick={() => window.open(cert.credentialUrl, '_blank')}>Show Credential</Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No certifications added.</p>
                )}
              </div>
            </Card>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
