import { ReactElement } from 'react';
import {
  AiOutlineAppstore as NFTIcon,
  AiOutlineArrowDown as ArrowDownIcon,
  AiOutlineEye as EyeIcon,
  AiOutlinePlus as PlusIcon,
  AiOutlinePlusCircle as PlusCircleIcon,
  AiOutlineQrcode as QRCodeIcon,
  AiOutlineSearch as SearchIcon,
  AiOutlineSwap as SwapIcon,
} from 'react-icons/ai';
import {
  BiCalculator as CalculatorIcon,
  BiImport as ImportIcon,
  BiRefresh as RetryIcon,
  BiWindowAlt as WindowIcon,
} from 'react-icons/bi';
import {
  BsChevronLeft as ChevronLeftIcon,
  BsChevronRight as ChevronRightIcon,
  BsShieldLock as ShieldIcon,
  BsThreeDots as EllipsisIcon,
} from 'react-icons/bs';
import { FaSwimmingPool as PoolIcon } from 'react-icons/fa';
import {
  HiOutlineClipboardCheck as CopySuccessIcon,
  HiOutlineInformationCircle as InfoIcon,
} from 'react-icons/hi';
import { IoMdCloseCircleOutline as CloseCircleIcon } from 'react-icons/io';
import {
  IoAlertCircleOutline as AlertIcon,
  IoChatbubblesOutline as ChatBubbleIcon,
  IoDocumentTextOutline as TermsIcon,
  IoSettingsOutline as SettingsIcon,
  IoWalletOutline as WalletIcon,
  IoWarningOutline as WarningIcon,
} from 'react-icons/io5';
import {
  MdCheck as CheckIcon,
  MdClose as CloseIcon,
  MdContentCopy as CopyIcon,
  MdDeleteOutline as TrashIcon,
  MdDesktopMac as DesktopIcon,
  MdDownload as DownloadIcon,
  MdEditCalendar as EditCalendarIcon,
  MdLockOpen as LockOpenIcon,
  MdLockOutline as LockClosedIcon,
  MdOpenInNew as OpenInNewIcon,
  MdOutlineCheckCircleOutline as CheckCircleIcon,
  MdOutlineDownload as ReceiveIcon,
  MdOutlineEdit as EditIcon,
  MdOutlineEmail as MailIcon,
  MdOutlineHelpOutline as HelpIcon,
  MdOutlinePrivacyTip as PrivacyIcon,
  MdOutlinePublic as PublicIcon,
  MdOutlineUpload as SendIcon,
  MdRadioButtonUnchecked as EmptyCircleIcon,
  MdRefresh as RefreshIcon,
  MdRssFeed as ActivityFeedIcon,
  MdSave as SaveIcon,
  MdSwapVert as SwitchVerticalIcon,
} from 'react-icons/md';
import {
  TbChefHat as ChefHatIcon,
  TbPuzzle as DAppsIcon,
  TbTractor as TractorIcon,
} from 'react-icons/tb';
import { ImageSwirl, styleguide } from '@react-shared';

export enum IconType {
  Refresh = 'Refresh',
  ActivityFeed = 'ActivityFeed',
  OpenInNew = 'OpenInNew',
  Check = 'Check',
  Copy = 'Copy',
  CopySuccess = 'CopySuccess',
  Alert = 'Alert',
  Info = 'Info',
  Plus = 'Plus',
  PlusCircle = 'PlusCircle',
  Eye = 'Eye',
  Help = 'Help',
  Warning = 'Warning',
  Shield = 'Shield',
  Public = 'Public',
  Pool = 'Pool',
  LockOpen = 'LockOpen',
  CheckCircle = 'CheckCircle',
  EmptyCircle = 'EmptyCircle',
  CloseCircle = 'CloseCircle',
  ChevronRight = 'ChevronRight',
  ChevronLeft = 'ChevronLeft',
  LockClosed = 'LockClosed',
  Settings = 'Settings',
  Edit = 'Edit',
  Search = 'Search',
  Retry = 'Retry',
  Trash = 'Trash',
  Calculator = 'Calculator',
  Import = 'Import',
  Send = 'Send',
  Receive = 'Receive',
  QRCode = 'QRCode',
  Close = 'Close',
  Wallet = 'Wallet',
  Ellipsis = 'Ellipsis',
  ArrowDown = 'ArrowDown',
  Swap = 'Swap',
  DApps = 'DApps',
  NFT = 'NFT',
  Window = 'Window',
  Mail = 'Mail',
  ChatBubble = 'ChatBubble',
  SwitchVertical = 'SwitchVertical',
  Save = 'Save',
  Download = 'Download',
  Privacy = 'Privacy',
  Terms = 'Terms',
  Desktop = 'Desktop',
  TractorIcon = 'TractorIcon',
  EditCalendarIcon = 'EditCalendarIcon',
  ChefHatIcon = 'ChefHatIcon',
}

export const renderIcon = (
  iconTypeOrSrc: IconType | string,
  size: number = 20,
  color: string = styleguide.colors.white,
): ReactElement => {
  const props = { size, color };

  switch (iconTypeOrSrc) {
    case IconType.Pool:
      return <PoolIcon {...props} />;
    case IconType.TractorIcon:
      return <TractorIcon {...props} />;
    case IconType.ChefHatIcon:
      return <ChefHatIcon {...props} />;
    case IconType.EditCalendarIcon:
      return <EditCalendarIcon {...props} />;
    case IconType.Refresh:
      return <RefreshIcon {...props} />;
    case IconType.ActivityFeed:
      return <ActivityFeedIcon {...props} />;
    case IconType.OpenInNew:
      return <OpenInNewIcon {...props} />;
    case IconType.Check:
      return <CheckIcon {...props} />;
    case IconType.Copy:
      return <CopyIcon {...props} />;
    case IconType.CopySuccess:
      return <CopySuccessIcon {...props} />;
    case IconType.Alert:
      return <AlertIcon {...props} />;
    case IconType.LockOpen:
      return <LockOpenIcon {...props} />;
    case IconType.Public:
      return <PublicIcon {...props} />;
    case IconType.Shield:
      return <ShieldIcon {...props} />;
    case IconType.Info:
      return <InfoIcon {...props} />;
    case IconType.Help:
      return <HelpIcon {...props} />;
    case IconType.Plus:
      return <PlusIcon {...props} />;
    case IconType.PlusCircle:
      return <PlusCircleIcon {...props} />;
    case IconType.Eye:
      return <EyeIcon {...props} />;
    case IconType.Warning:
      return <WarningIcon {...props} />;
    case IconType.CheckCircle:
      return <CheckCircleIcon {...props} />;
    case IconType.EmptyCircle:
      return <EmptyCircleIcon {...props} />;
    case IconType.CloseCircle:
      return <CloseCircleIcon {...props} />;
    case IconType.ChevronRight:
      return <ChevronRightIcon {...props} />;
    case IconType.ChevronLeft:
      return <ChevronLeftIcon {...props} />;
    case IconType.LockClosed:
      return <LockClosedIcon {...props} />;
    case IconType.Settings:
      return <SettingsIcon {...props} />;
    case IconType.Edit:
      return <EditIcon {...props} />;
    case IconType.Search:
      return <SearchIcon {...props} />;
    case IconType.Retry:
      return <RetryIcon {...props} />;
    case IconType.Trash:
      return <TrashIcon {...props} />;
    case IconType.Calculator:
      return <CalculatorIcon {...props} />;
    case IconType.Import:
      return <ImportIcon {...props} />;
    case IconType.Send:
      return <SendIcon {...props} />;
    case IconType.Receive:
      return <ReceiveIcon {...props} />;
    case IconType.QRCode:
      return <QRCodeIcon {...props} />;
    case IconType.Close:
      return <CloseIcon {...props} />;
    case IconType.Wallet:
      return <WalletIcon {...props} />;
    case IconType.Ellipsis:
      return <EllipsisIcon {...props} />;
    case IconType.ArrowDown:
      return <ArrowDownIcon {...props} />;
    case IconType.Swap:
      return <SwapIcon {...props} />;
    case IconType.DApps:
      return <DAppsIcon {...props} />;
    case IconType.NFT:
      return <NFTIcon {...props} />;
    case IconType.Window:
      return <WindowIcon {...props} />;
    case IconType.Mail:
      return <MailIcon {...props} />;
    case IconType.ChatBubble:
      return <ChatBubbleIcon {...props} />;
    case IconType.SwitchVertical:
      return <SwitchVerticalIcon {...props} />;
    case IconType.Save:
      return <SaveIcon {...props} />;
    case IconType.Download:
      return <DownloadIcon {...props} />;
    case IconType.Privacy:
      return <PrivacyIcon {...props} />;
    case IconType.Terms:
      return <TermsIcon {...props} />;
    case IconType.Desktop:
      return <DesktopIcon {...props} />;
    default:
      return (
        (<img
          src={iconTypeOrSrc}
          alt="icon"
          height={size}
          width={size}
          onError={({ currentTarget }) => {
            currentTarget.onerror = null;
            currentTarget.src = ImageSwirl();
          }}
        />)
      );
  }
};
