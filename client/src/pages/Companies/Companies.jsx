import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCompanies, followCompany, unfollowCompany } from '../../redux/slices/companySlice';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { FaSearch, FaBuilding } from 'react-icons/fa';

const Companies = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { companies, isLoading } = useSelector((state) => state.companies);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  const handleFollow = (companyId, isFollowing) => {
    if (isFollowing) {
      dispatch(unfollowCompany(companyId));
    } else {
      dispatch(followCompany(companyId));
    }
  };

  const filteredCompanies = companies.filter((c) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.industry && c.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Companies Directory</h1>
      </div>

      <Card className="p-4 flex items-center gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
            placeholder="Search companies by name or industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="primary">Search</Button>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 text-center py-10 text-gray-500">Loading companies...</div>
        ) : filteredCompanies.length === 0 ? (
          <div className="col-span-2 text-center py-10 text-gray-500">No companies found.</div>
        ) : (
          filteredCompanies.map((company) => {
            const isFollowing = company.followers?.includes(user?._id);
            const followersCount = company.followers?.length || 0;

            return (
              <Card key={company._id} className="flex flex-col sm:flex-row items-center sm:items-start p-5 hover:border-primary/50 transition-colors border border-transparent cursor-pointer">
                {company.logo && company.logo !== 'https://icon-library.com/images/company-icon-png/company-icon-png-17.jpg' ? (
                  <img src={company.logo} alt={company.name} className="w-20 h-20 rounded-lg flex-shrink-0 object-cover shadow-sm mb-4 sm:mb-0 sm:mr-6" />
                ) : (
                  <div className="w-20 h-20 rounded-lg flex-shrink-0 bg-blue-500 flex items-center justify-center text-white font-bold text-3xl shadow-sm mb-4 sm:mb-0 sm:mr-6">
                    <FaBuilding size={32} />
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left w-full">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{company.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{company.industry || 'Tech Company'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{followersCount} followers</p>
                  <div className="mt-4 flex space-x-2 justify-center sm:justify-start">
                    <Button 
                      variant={isFollowing ? 'secondary' : 'outline'} 
                      size="sm" 
                      className="rounded-full flex-1 sm:flex-none"
                      onClick={(e) => { e.stopPropagation(); handleFollow(company._id, isFollowing); }}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    <Button variant="secondary" size="sm" className="rounded-full flex-1 sm:flex-none">View Jobs</Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Companies;
