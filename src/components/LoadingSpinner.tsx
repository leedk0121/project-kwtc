import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
}

function LoadingSpinner({ message = '불러오는 중...' }: LoadingSpinnerProps) {
  return (
    <div className="loading-wrapper">
      <div className="loading-spinner"></div>
      <p>{message}</p>
    </div>
  );
}

export default LoadingSpinner;
