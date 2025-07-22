import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, isAfter, isToday, parse } from 'date-fns';
import { enAU } from 'date-fns/locale';

// Helper to format date as DD/MM/YYYY
const formatDate = (date: Date | null) => (date ? format(date, 'dd/MM/yyyy') : '');

export type CompanyComplianceFormValues = {
  basFrequency: 'Monthly' | 'Quarterly' | 'Yearly';
  nextBasDue: Date | null;
  fbtApplicable: boolean;
  nextFbtDue?: Date | null;
  iasRequired: boolean;
  iasFrequency?: 'Monthly' | 'Quarterly' | 'Yearly';
  nextIasDue?: Date | null;
  financialEndDate: Date | null;
};

const basOptions = ['Monthly', 'Quarterly', 'Yearly'] as const;
const iasOptions = ['Monthly', 'Quarterly', 'Yearly'] as const;

export default function CompanyComplianceForm({ onSubmit, defaultValues }: { onSubmit: (data: CompanyComplianceFormValues) => void, defaultValues?: Partial<CompanyComplianceFormValues> }) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<CompanyComplianceFormValues>({
    defaultValues: {
      basFrequency: 'Quarterly',
      nextBasDue: null,
      fbtApplicable: false,
      nextFbtDue: null,
      iasRequired: false,
      iasFrequency: 'Quarterly',
      nextIasDue: null,
      financialEndDate: null,
      ...defaultValues,
    },
  });

  const fbtApplicable = watch('fbtApplicable');
  const iasRequired = watch('iasRequired');

  // Coerce radio values to boolean
  const fbtApplicableValue = String(fbtApplicable) === 'true';
  const iasRequiredValue = String(iasRequired) === 'true';

  // Helper for date validation (must be today or future)
  const isFutureDate = (date: Date | null): boolean => !!date && (isAfter(date, new Date()) || isToday(date));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl mx-auto p-6 bg-white rounded shadow space-y-6">
      {/* BAS Frequency */}
      <div>
        <label className="block font-medium mb-1">BAS Frequency <span className="text-red-500">*</span></label>
        <select
          {...register('basFrequency', { required: 'BAS Frequency is required' })}
          className="w-full border rounded px-3 py-2"
        >
          {basOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {errors.basFrequency && <p className="text-red-500 text-sm">{errors.basFrequency.message}</p>}
      </div>

      {/* Next BAS Due */}
      <div>
        <label className="block font-medium mb-1">Next BAS Due <span className="text-red-500">*</span></label>
        <Controller
          control={control}
          name="nextBasDue"
          rules={{
            required: 'Next BAS Due is required',
            validate: (value: Date | null | undefined) => isFutureDate(value ?? null) || 'Date must be today or in the future',
          }}
          render={({ field }: { field: any }) => (
            <DatePicker
              {...field}
              selected={field.value}
              onChange={field.onChange}
              dateFormat="dd/MM/yyyy"
              className="w-full border rounded px-3 py-2"
              placeholderText="DD/MM/YYYY"
              locale={enAU}
            />
          )}
        />
        {errors.nextBasDue && <p className="text-red-500 text-sm">{errors.nextBasDue.message}</p>}
      </div>

      {/* FBT Applicable */}
      <div>
        <label className="block font-medium mb-1">FBT Applicable? <span className="text-red-500">*</span></label>
        <div className="flex gap-4">
          <label>
            <input type="radio" value="true" {...register('fbtApplicable', { required: 'Required' })} /> Yes
          </label>
          <label>
            <input type="radio" value="false" {...register('fbtApplicable', { required: 'Required' })} /> No
          </label>
        </div>
        {errors.fbtApplicable && <p className="text-red-500 text-sm">{errors.fbtApplicable.message}</p>}
      </div>

      {/* Next FBT Due Date (if applicable) */}
      {fbtApplicableValue ? (
        <div>
          <label className="block font-medium mb-1">Next FBT Due Date <span className="text-red-500">*</span></label>
          <Controller
            control={control}
            name="nextFbtDue"
            rules={{
              required: 'Next FBT Due Date is required',
              validate: (value: Date | null | undefined) => isFutureDate(value ?? null) || 'Date must be today or in the future',
            }}
            render={({ field }: { field: any }) => (
              <DatePicker
                {...field}
                selected={field.value}
                onChange={field.onChange}
                dateFormat="dd/MM/yyyy"
                className="w-full border rounded px-3 py-2"
                placeholderText="DD/MM/YYYY"
                locale={enAU}
              />
            )}
          />
          {errors.nextFbtDue && <p className="text-red-500 text-sm">{errors.nextFbtDue.message}</p>}
        </div>
      ) : null}

      {/* IAS Required */}
      <div>
        <label className="block font-medium mb-1">IAS Required? <span className="text-red-500">*</span></label>
        <div className="flex gap-4">
          <label>
            <input type="radio" value="true" {...register('iasRequired', { required: 'Required' })} /> Yes
          </label>
          <label>
            <input type="radio" value="false" {...register('iasRequired', { required: 'Required' })} /> No
          </label>
        </div>
        {errors.iasRequired && <p className="text-red-500 text-sm">{errors.iasRequired.message}</p>}
      </div>

      {/* IAS Frequency and Next IAS Due (if required) */}
      {iasRequiredValue && (
        <>
          <div>
            <label className="block font-medium mb-1">IAS Frequency <span className="text-red-500">*</span></label>
            <select
              {...register('iasFrequency', { required: 'IAS Frequency is required' })}
              className="w-full border rounded px-3 py-2"
            >
              {iasOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.iasFrequency && <p className="text-red-500 text-sm">{errors.iasFrequency.message}</p>}
          </div>
          <div>
            <label className="block font-medium mb-1">Next IAS Due <span className="text-red-500">*</span></label>
            <Controller
              control={control}
              name="nextIasDue"
              rules={{
                required: 'Next IAS Due is required',
                validate: (value: Date | null | undefined) => isFutureDate(value ?? null) || 'Date must be today or in the future',
              }}
              render={({ field }: { field: any }) => (
                <DatePicker
                  {...field}
                  selected={field.value}
                  onChange={field.onChange}
                  dateFormat="dd/MM/yyyy"
                  className="w-full border rounded px-3 py-2"
                  placeholderText="DD/MM/YYYY"
                  locale={enAU}
                />
              )}
            />
            {errors.nextIasDue && <p className="text-red-500 text-sm">{errors.nextIasDue.message}</p>}
          </div>
        </>
      )}

      {/* Financial End Date */}
      <div>
        <label className="block font-medium mb-1">Financial End Date <span className="text-red-500">*</span></label>
        <Controller
          control={control}
          name="financialEndDate"
          rules={{
            required: 'Financial End Date is required',
            validate: (value: Date | null | undefined) => value instanceof Date || 'Invalid date',
          }}
          render={({ field }: { field: any }) => (
            <DatePicker
              {...field}
              selected={field.value}
              onChange={field.onChange}
              dateFormat="dd/MM/yyyy"
              className="w-full border rounded px-3 py-2"
              placeholderText="DD/MM/YYYY"
              locale={enAU}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          )}
        />
        {errors.financialEndDate && <p className="text-red-500 text-sm">{errors.financialEndDate.message}</p>}
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Save</button>
    </form>
  );
} 