import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../modules/users/entities/user.entity';
import { Doctor } from '../modules/doctors/entities/doctor.entity';
import { DoctorAvailability } from '../modules/doctors/entities/doctor-availability.entity';
import { BoardMember } from '../modules/board-members/entities/board-member.entity';
import { Partner } from '../modules/partners/entities/partner.entity';
import { ContactInfo } from '../modules/contact/entities/contact-info.entity';
import { Statistic } from '../modules/statistics/entities/statistic.entity';
import { Service, ServiceCategory, NigeriaLocation } from '../modules/services/entities/service.entity';
import { Appointment, AppointmentStatus } from '../modules/appointments/entities/appointment.entity';

export async function seedDatabase(dataSource: DataSource) {
  console.log('🌱 Starting database seeding...');

  // 1. Create Admin Users (only if they don't exist)
  const userRepository = dataSource.getRepository(User);
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  
  // Check if admin already exists
  const existingAdmin = await userRepository.findOne({ 
    where: { email: 'admin@nmsl.app' } 
  });
  
  if (!existingAdmin) {
    const admin = userRepository.create({
      name: 'Emeka Nwosu',
      email: 'admin@nmsl.app',
      password: adminPassword,
      role: UserRole.ADMIN,
      location: 'Abuja',
      state: 'FCT',
      address: 'NMSL Headquarters, Central Business District, Abuja',
      phone: '+234 801 234 5678',
      gender: 'male',
      isActive: true,
    });
    await userRepository.save(admin);
    console.log('✅ Created admin user');
  } else {
    console.log('⏭️  Admin user already exists, skipping...');
  }

  // Create Appointment Officers (only if they don't exist)
  const existingOfficer1 = await userRepository.findOne({ 
    where: { email: 'officer1@nmsl.app' } 
  });
  
  if (!existingOfficer1) {
    const officer1 = userRepository.create({
      name: 'Sarah Johnson',
      email: 'officer1@nmsl.app',
      password: adminPassword,
      role: UserRole.APPOINTMENT_OFFICER,
      location: 'Lagos',
      state: 'Lagos',
      phone: '+234 802 345 6789',
      gender: 'female',
      isActive: true,
    });
    await userRepository.save(officer1);
  }

  const existingOfficer2 = await userRepository.findOne({ 
    where: { email: 'officer2@nmsl.app' } 
  });
  
  if (!existingOfficer2) {
    const officer2 = userRepository.create({
      name: 'Michael Chen',
      email: 'officer2@nmsl.app',
      password: adminPassword,
      role: UserRole.APPOINTMENT_OFFICER,
      location: 'Abuja',
      state: 'FCT',
      phone: '+234 803 456 7890',
      gender: 'male',
      isActive: true,
    });
    await userRepository.save(officer2);
  }
  
  console.log('✅ Checked/created appointment officers');

  // 2. Create Minimal Doctors - One per specialty across all locations
  const doctorRepository = dataSource.getRepository(Doctor);
  const doctorAvailabilityRepository = dataSource.getRepository(DoctorAvailability);
  
  const doctors = [
    { name: 'Dr. Muhammad Ibrahim', email: 'muhammad.ibrahim@nmsl.app', specialty: 'General Practice', qualifications: 'MBBS, FMCGP', location: 'ABUJA', state: 'FCT', phone: '+234 805 111 0001' },
    { name: 'Dr. Sarah Adeyemi', email: 'sarah.adeyemi@nmsl.app', specialty: 'Cardiology', qualifications: 'MBBS, MD', location: 'LAGOS', state: 'Lagos', phone: '+234 806 222 0001' },
    { name: 'Dr. Grace Okonkwo', email: 'grace.okonkwo@nmsl.app', specialty: 'Pediatrics', qualifications: 'MBBS, FWACP', location: 'BENIN', state: 'Edo', phone: '+234 807 333 0001' },
    { name: 'Dr. James Oluwole', email: 'james.oluwole@nmsl.app', specialty: 'Gynecology', qualifications: 'MBBS, FWACS', location: 'KADUNA', state: 'Kaduna', phone: '+234 808 444 0001' },
    { name: 'Dr. Ahmed Bello', email: 'ahmed.bello@nmsl.app', specialty: 'Orthopedics', qualifications: 'MBBS, FWACS', location: 'PORT_HARCOURT', state: 'Rivers', phone: '+234 809 555 0001' },
    { name: 'Dr. Chioma Nwosu', email: 'chioma.nwosu@nmsl.app', specialty: 'Dermatology', qualifications: 'MBBS, FWACP', location: 'WARRI', state: 'Delta', phone: '+234 810 666 0001' },
    { name: 'Dr. Tunde Bakare', email: 'tunde.bakare@nmsl.app', specialty: 'Neurology', qualifications: 'MBBS, FWACP', location: 'ABUJA', state: 'FCT', phone: '+234 805 111 0002' },
    { name: 'Dr. Amina Yusuf', email: 'amina.yusuf@nmsl.app', specialty: 'Ophthalmology', qualifications: 'MBBS, FMCOphth', location: 'LAGOS', state: 'Lagos', phone: '+234 806 222 0002' },
    { name: 'Dr. Emeka Obi', email: 'emeka.obi@nmsl.app', specialty: 'ENT', qualifications: 'MBBS, FWACS', location: 'BENIN', state: 'Edo', phone: '+234 807 333 0002' },
    { name: 'Dr. Fatima Lawal', email: 'fatima.lawal@nmsl.app', specialty: 'Psychiatry', qualifications: 'MBBS, FMCPsych', location: 'KADUNA', state: 'Kaduna', phone: '+234 808 444 0002' },
    { name: 'Dr. Chidi Okafor', email: 'chidi.okafor@nmsl.app', specialty: 'Radiology', qualifications: 'MBBS, FWACR', location: 'PORT_HARCOURT', state: 'Rivers', phone: '+234 809 555 0002' },
    { name: 'Dr. Blessing Eze', email: 'blessing.eze@nmsl.app', specialty: 'Internal Medicine', qualifications: 'MBBS, FWACP', location: 'WARRI', state: 'Delta', phone: '+234 810 666 0002' },
    { name: 'Dr. Yusuf Mohammed', email: 'yusuf.mohammed@nmsl.app', specialty: 'Dentistry', qualifications: 'BDS, FMCDS', location: 'ABUJA', state: 'FCT', phone: '+234 805 111 0003' },
    { name: 'Dr. Jennifer Afolabi', email: 'jennifer.afolabi@nmsl.app', specialty: 'Emergency Medicine', qualifications: 'MBBS, FWACEM', location: 'LAGOS', state: 'Lagos', phone: '+234 806 222 0003' },
  ];

  const doctorPassword = await bcrypt.hash('Doctor@123', 10);
  
  const savedDoctors: Doctor[] = [];
  for (const doc of doctors) {
    // Check if doctor already exists
    const existing = await doctorRepository.findOne({ where: { email: doc.email } });
    if (existing) {
      console.log(`⏭️  Doctor ${doc.name} already exists, skipping...`);
      continue;
    }
    
    const doctor = doctorRepository.create({
      ...doc,
      password: doctorPassword,
      isActive: true,
    });
    
    const savedDoctor = await doctorRepository.save(doctor);
    savedDoctors.push(savedDoctor);
    
    // Create default availability (available Monday-Friday, 9-5)
    const availability = doctorAvailabilityRepository.create({
      doctor: savedDoctor,
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      useUniformTime: true,
      uniformTimeStart: '09:00',
      uniformTimeEnd: '17:00',
      customTimes: null,
    });
    
    await doctorAvailabilityRepository.save(availability);
  }
  
  console.log(`✅ Created ${savedDoctors.length} doctors covering all locations and specialties`);

  // 3. Create Sample Patients
  const patientPassword = await bcrypt.hash('Patient@123', 10);
  const patients = [
    {
      name: 'John Doe',
      email: 'john.doe@email.com',
      location: 'Abuja',
      state: 'FCT',
      phone: '+234 811 111 2222',
      gender: 'male',
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      location: 'Lagos',
      state: 'Lagos',
      phone: '+234 812 222 3333',
      gender: 'female',
    },
  ];

  const patientEntities = patients.map(p =>
    userRepository.create({
      ...p,
      password: patientPassword,
      role: UserRole.PATIENT,
      isActive: true,
    })
  );
  await userRepository.save(patientEntities);
  console.log('✅ Created sample patients');

  // 4. Create Board Members
  const boardMemberRepository = dataSource.getRepository(BoardMember);
  const boardMembers = [
    {
      name: 'Mr. Adedapo A. Segun',
      title: 'Chairman',
      photoUrl: '/board/adedapo-segun.jpg',
      bio: 'Leadership committed to excellence in healthcare delivery across Nigeria',
      order: 1,
      isActive: true,
    },
    {
      name: 'Dr. Chioma Eze',
      title: 'Chief Medical Officer',
      photoUrl: '/board/chioma-eze.jpg',
      bio: 'Experienced medical professional with 25+ years in healthcare management',
      order: 2,
      isActive: true,
    },
    {
      name: 'Mr. Ibrahim Musa',
      title: 'Executive Director',
      photoUrl: '/board/ibrahim-musa.jpg',
      bio: 'Strategic leader driving innovation in healthcare services',
      order: 3,
      isActive: true,
    },
  ];

  await boardMemberRepository.save(boardMembers);
  console.log('✅ Created board members');

  // 5. Create Partners
  const partnerRepository = dataSource.getRepository(Partner);
  const partners = [
    {
      name: 'African Medical Centre of Excellence Abuja',
      logoUrl: '/partners/amce-abuja.png',
      description: 'Leading medical excellence center in Abuja',
      order: 1,
      isActive: true,
    },
    {
      name: 'Lagos University Teaching Hospital',
      logoUrl: '/partners/luth.png',
      description: 'Premier teaching hospital in Lagos',
      order: 2,
      isActive: true,
    },
    {
      name: 'National Hospital Abuja',
      logoUrl: '/partners/national-hospital.png',
      description: 'Federal tertiary healthcare institution',
      order: 3,
      isActive: true,
    },
  ];

  await partnerRepository.save(partners);
  console.log('✅ Created partners');

  // 6. Create Contact Information
  const contactRepository = dataSource.getRepository(ContactInfo);
  const contact = contactRepository.create({
    phone: '+234 903 193 0032',
    emailPrimary: 'nmshutako@nnpcgroup.com',
    emailSecondary: 'nmshutako@gmail.com',
    addressLine1: 'PLOT 201 NGOZI OKONJO-IWEALA WAY',
    addressLine2: 'UTAKO, ABUJA, NIGERIA',
    city: 'Abuja',
    country: 'Nigeria',
    officeHours: 'Monday - Sunday: 24 Hours',
    emergencyHours: 'Available 24/7',
  });
  await contactRepository.save(contact);
  console.log('✅ Created contact information');

  // 7. Create Statistics
  const statisticRepository = dataSource.getRepository(Statistic);
  const statistics = [
    {
      value: '15+',
      label: 'Years',
      sublabel: 'Healthcare Excellence',
      icon: 'award',
      order: 1,
    },
    {
      value: '6',
      label: 'Facilities',
      sublabel: 'Across Nigeria',
      icon: 'building',
      order: 2,
    },
    {
      value: '250K+',
      label: 'Patients',
      sublabel: 'Treated Annually',
      icon: 'users',
      order: 3,
    },
    {
      value: '24/7',
      label: 'Emergency',
      sublabel: 'Services Available',
      icon: 'clock',
      order: 4,
    },
  ];

  await statisticRepository.save(statistics);
  console.log('✅ Created statistics');

  // 8. Create Services
  const serviceRepository = dataSource.getRepository(Service);
  const services = [
    {
      name: 'Accident & Emergency',
      category: ServiceCategory.EMERGENCY_SERVICES,
      location: NigeriaLocation.ABUJA,
      shortDescription: '24/7 emergency care and trauma services',
      fullDescription: 'Our Accident & Emergency department provides round-the-clock emergency medical care with state-of-the-art facilities and experienced medical professionals ready to handle all types of medical emergencies.',
      bannerImageUrl: '/services/emergency-banner.jpg',
      iconImageUrl: '/services/emergency-icon.svg',
      keyServices: [
        { title: '24/7 Emergency Response', description: 'Immediate care for urgent medical cases' },
        { title: 'Trauma Unit', description: 'Advanced trauma care facilities' },
        { title: 'Ambulance Services', description: 'Rapid response ambulance services' },
      ],
      isActive: true,
    },
    {
      name: 'General Practice',
      category: ServiceCategory.PRIMARY_CARE,
      location: NigeriaLocation.LAGOS,
      shortDescription: 'Comprehensive primary healthcare services',
      fullDescription: 'Our General Practice department offers comprehensive primary healthcare services including routine check-ups, preventive care, and management of common medical conditions.',
      bannerImageUrl: '/services/general-practice-banner.jpg',
      iconImageUrl: '/services/general-practice-icon.svg',
      keyServices: [
        { title: 'Routine Check-ups', description: 'Regular health assessments and screenings' },
        { title: 'Preventive Care', description: 'Vaccination and health education' },
        { title: 'Chronic Disease Management', description: 'Ongoing care for chronic conditions' },
      ],
      isActive: true,
    },
    {
      name: 'Specialized Cardiology Care',
      category: ServiceCategory.SPECIALIZED_CARE,
      location: NigeriaLocation.ABUJA,
      shortDescription: 'Advanced cardiac care and treatment',
      fullDescription: 'Our Cardiology department provides comprehensive cardiac care including diagnostics, treatment, and rehabilitation for various heart conditions.',
      bannerImageUrl: '/services/cardiology-banner.jpg',
      iconImageUrl: '/services/cardiology-icon.svg',
      keyServices: [
        { title: 'Cardiac Diagnostics', description: 'ECG, Echo, and stress tests' },
        { title: 'Heart Disease Management', description: 'Treatment of cardiovascular conditions' },
        { title: 'Cardiac Rehabilitation', description: 'Post-treatment recovery programs' },
      ],
      isActive: true,
    },
  ];

  await serviceRepository.save(services);
  console.log('✅ Created services');

  // 9. Create Sample Appointments
  const appointmentRepository = dataSource.getRepository(Appointment);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const appointments = [
    {
      patientId: patientEntities[0].id,
      doctorId: savedDoctors[0].id,
      patientName: patientEntities[0].name,
      patientEmail: patientEntities[0].email,
      patientPhone: patientEntities[0].phone,
      doctorName: savedDoctors[0].name,
      appointmentDate: tomorrowStr,
      appointmentTime: '09:00',
      status: AppointmentStatus.PENDING,
      reason: 'Routine check-up',
      specialty: savedDoctors[0].specialty,
      location: savedDoctors[0].location,
      fee: 0,
      visitType: 'Physical',
      isUrgent: false,
      isConflicted: false,
    },
  ];

  await appointmentRepository.save(appointments);
  console.log('✅ Created sample appointments');

  console.log('🎉 Database seeding completed successfully!');
}
